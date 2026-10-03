import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import { Product, resolveMediaHierarchy } from "../../../models/product.model.js";
import { Coupon } from "../../../models/coupon.model.js";
import { calculateDiscountPercentage } from "../../../utils/calculateDiscountPercentage.js";

class CartService {
  async findUserCart(user) {
    const userId = user._id || user;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId });
      await cart.save();
    }

    let cartItems = await CartItem.find({ cart: cart._id })
      .populate({
        path: "product",
        populate: { path: "seller", select: "sellerName businessDetails" },
      })
      .sort({ createdAt: -1 });

    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItems = 0;
    const validationWarnings = [];
    const validCartItems = [];

    const now = new Date();

    // 1. Authoritative Validation per item against current Product and Variant catalog
    for (const item of cartItems) {
      const prod = item.product;

      // Clean up orphaned cart items if product was removed from marketplace
      if (!prod) {
        await CartItem.findByIdAndDelete(item._id);
        validationWarnings.push({
          type: "ITEM_UNAVAILABLE",
          message: "An item in your cart is no longer available and was removed.",
        });
        continue;
      }

      let currentUnitMrp = prod.mrpPrice;
      let currentUnitSelling = prod.sellingPrice;
      let currentStock = prod.countInStock || 0;
      let isVariantActive = true;
      let matchedVariant = null;

      if (item.variantId && prod.hasVariants && Array.isArray(prod.variants)) {
        matchedVariant = prod.variants.id(item.variantId);
        if (matchedVariant) {
          currentUnitMrp = matchedVariant.mrpPrice;
          currentUnitSelling = matchedVariant.sellingPrice;
          currentStock = matchedVariant.countInStock || 0;
          if (matchedVariant.status && matchedVariant.status !== "ACTIVE") {
            isVariantActive = false;
          }
        } else {
          isVariantActive = false;
        }
      }

      // Check if price changed since item was added
      const prevUnitSelling = Math.round(item.sellingPrice / Math.max(1, item.quantity));
      if (currentUnitSelling !== prevUnitSelling) {
        const priceDiff = currentUnitSelling - prevUnitSelling;
        validationWarnings.push({
          type: "PRICE_CHANGED",
          productId: prod._id,
          title: prod.title,
          oldPrice: prevUnitSelling,
          newPrice: currentUnitSelling,
          diff: priceDiff,
          message: `Price for "${prod.title}" changed from ₹${prevUnitSelling.toLocaleString("en-IN")} to ₹${currentUnitSelling.toLocaleString("en-IN")}.`,
        });

        item.sellingPrice = item.quantity * currentUnitSelling;
        item.mrpPrice = item.quantity * currentUnitMrp;
        await item.save();
      }

      // Stock intelligence status
      let stockStatus = "IN_STOCK";
      let stockWarning = null;

      if (!isVariantActive || currentStock <= 0) {
        stockStatus = "OUT_OF_STOCK";
        stockWarning = "Currently Out of Stock";
      } else if (currentStock < item.quantity) {
        stockStatus = "LOW_STOCK";
        stockWarning = `Only ${currentStock} units available in stock.`;
      } else if (currentStock <= 5) {
        stockStatus = "LOW_STOCK";
        stockWarning = `Only ${currentStock} left in stock.`;
      }

      // Resolve authoritative live image for variant or color group
      const resolvedMedia = resolveMediaHierarchy(prod, matchedVariant, {});

      // Attach authoritative live metadata to item for client presentation
      const itemObj = item.toObject();
      itemObj.unitSellingPrice = currentUnitSelling;
      itemObj.unitMrpPrice = currentUnitMrp;
      itemObj.stockStatus = stockStatus;
      itemObj.availableStock = currentStock;
      itemObj.stockWarning = stockWarning;
      if (itemObj.selectedVariant) {
        itemObj.selectedVariant.image = resolvedMedia[0] || itemObj.selectedVariant.image || prod.images?.[0] || "";
      }

      validCartItems.push(itemObj);

      totalItems += item.quantity;
      totalPrice += item.mrpPrice;
      totalDiscountedPrice += item.sellingPrice;
    }

    // 2. Authoritative Coupon Re-validation
    let appliedCouponPrice = 0;
    if (cart.couponCode) {
      const activeCoupon = await Coupon.findOne({ code: cart.couponCode.toUpperCase() });
      const isValidCoupon =
        activeCoupon &&
        activeCoupon.isActive &&
        (!activeCoupon.validityEndDate || new Date(activeCoupon.validityEndDate) >= now) &&
        (!activeCoupon.validityStartDate || new Date(activeCoupon.validityStartDate) <= now);

      if (isValidCoupon) {
        if (totalDiscountedPrice >= (activeCoupon.minimumOrderValue || 0)) {
          appliedCouponPrice = Math.round(
            (totalDiscountedPrice * activeCoupon.discountPercentage) / 100
          );
          cart.couponPrice = appliedCouponPrice;
        } else {
          // Total dropped below coupon minimum
          validationWarnings.push({
            type: "COUPON_INVALIDATED",
            code: cart.couponCode,
            message: `Coupon '${cart.couponCode}' was removed because cart value is below ₹${activeCoupon.minimumOrderValue}.`,
          });
          cart.couponCode = null;
          cart.couponPrice = 0;
        }
      } else {
        validationWarnings.push({
          type: "COUPON_EXPIRED",
          code: cart.couponCode,
          message: `Coupon '${cart.couponCode}' has expired and was removed.`,
        });
        cart.couponCode = null;
        cart.couponPrice = 0;
      }
    } else {
      cart.couponPrice = 0;
    }

    // 3. Multi-Vendor Packaging & Shipment Breakdown
    const vendorMap = new Map();
    validCartItems.forEach((item) => {
      const seller = item.product?.seller;
      const sellerId = seller?._id?.toString() || "zosh-fulfillment";
      const sellerName =
        seller?.businessDetails?.businessName ||
        seller?.sellerName ||
        "Zosh Certified Fulfillment";

      if (!vendorMap.has(sellerId)) {
        // Calculate estimated delivery date: 3 business days from now
        const eta = new Date();
        eta.setDate(eta.getDate() + 3);

        vendorMap.set(sellerId, {
          sellerId,
          sellerName,
          businessDetails: seller?.businessDetails || null,
          fulfillmentType: "Zosh Assured Direct Fulfillment",
          estimatedDeliveryDate: eta.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          items: [],
          packageMrpPrice: 0,
          packageSellingPrice: 0,
          packageItemsCount: 0,
        });
      }

      const pkg = vendorMap.get(sellerId);
      pkg.items.push(item);
      pkg.packageMrpPrice += item.mrpPrice;
      pkg.packageSellingPrice += item.sellingPrice;
      pkg.packageItemsCount += item.quantity;
    });

    const sellerPackages = Array.from(vendorMap.values());

    // 4. Delivery Fee & Free Delivery Threshold Intelligence
    // Threshold: Orders >= ₹500 get FREE Delivery. Below ₹500 is ₹40 flat.
    const FREE_SHIPPING_THRESHOLD = 500;
    const isFreeShipping = totalDiscountedPrice >= FREE_SHIPPING_THRESHOLD || totalItems === 0;
    const deliveryFee = isFreeShipping ? 0 : 40;
    const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalDiscountedPrice);

    // 5. Compute Final Pricing Totals
    const finalSellingPriceAfterCoupon = Math.max(0, totalDiscountedPrice - appliedCouponPrice);
    const totalPayable = finalSellingPriceAfterCoupon + deliveryFee;
    const totalSavings = (totalPrice - finalSellingPriceAfterCoupon) + (isFreeShipping && totalPrice > 0 ? 40 : 0);

    cart.totalMrpPrice = totalPrice;
    cart.totalSellingPrice = finalSellingPriceAfterCoupon;
    cart.totalItem = totalItems;
    cart.discount =
      totalPrice > 0
        ? calculateDiscountPercentage(totalPrice, finalSellingPriceAfterCoupon)
        : 0;

    await cart.save();

    // 6. Return Enriched Response Object with Full Domain Intelligence
    const responsePayload = cart.toObject();
    responsePayload.cartItems = validCartItems;
    responsePayload.sellerPackages = sellerPackages;
    responsePayload.validationWarnings = validationWarnings;
    responsePayload.pricingSummary = {
      totalMrpPrice: totalPrice,
      itemSellingPrice: totalDiscountedPrice,
      couponDiscount: appliedCouponPrice,
      deliveryFee,
      totalPayable,
      totalSavings,
      isFreeDelivery: isFreeShipping,
      freeDeliveryThreshold: FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeDelivery: amountNeededForFreeShipping,
    };

    return responsePayload;
  }

  async addCartItem(user, productId, variantId = null, quantity = 1, legacyAttrs = {}) {
    const userId = user._id || user;
    const cart = await this.findUserCart(user);

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    let unitMrp = product.mrpPrice;
    let unitSelling = product.sellingPrice;
    let availableStock = product.countInStock;
    let selectedVariantSnapshot = {
      sku: "",
      title: "",
      attributes: [],
      image: product.images?.[0] || "",
    };

    let resolvedVariantId = null;

    if (product.hasVariants && product.variants.length > 0) {
      let matchedVariant = null;

      if (variantId) {
        matchedVariant = product.variants.id(variantId);
      }

      // Fallback: match by sku or legacy attributes if variantId not passed
      if (!matchedVariant && legacyAttrs.sku) {
        matchedVariant = product.variants.find((v) => v.sku === legacyAttrs.sku);
      }

      if (!matchedVariant) {
        // Pick first active variant if none specified
        matchedVariant = product.variants.find((v) => v.status === "ACTIVE") || product.variants[0];
      }

      if (!matchedVariant) {
        throw new Error("Selected product variant is unavailable");
      }

      resolvedVariantId = matchedVariant._id;
      unitMrp = matchedVariant.mrpPrice;
      unitSelling = matchedVariant.sellingPrice;
      availableStock = matchedVariant.countInStock;

      const resolvedMedia = resolveMediaHierarchy(product, matchedVariant, {});

      selectedVariantSnapshot = {
        sku: matchedVariant.sku,
        title: matchedVariant.title,
        attributes: matchedVariant.attributes || [],
        image:
          resolvedMedia[0] ||
          matchedVariant.images?.[0] ||
          product.images?.[0] ||
          "",
      };
    }

    const qty = Math.max(1, Number(quantity) || 1);

    if (availableStock < qty) {
      throw new Error(
        availableStock === 0
          ? "This item/variant is currently out of stock."
          : `Only ${availableStock} units available in stock.`
      );
    }

    // Check if item already exists in cart with same product & variant
    const query = {
      cart: cart._id,
      product: product._id,
      variantId: resolvedVariantId || null,
    };

    let existingItem = await CartItem.findOne(query);

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > availableStock) {
        throw new Error(`Cannot add more. Only ${availableStock} units available.`);
      }
      existingItem.quantity = newQty;
      existingItem.mrpPrice = newQty * unitMrp;
      existingItem.sellingPrice = newQty * unitSelling;
      await existingItem.save();
      return existingItem;
    }

    const newCartItem = new CartItem({
      cart: cart._id,
      product: product._id,
      variantId: resolvedVariantId,
      selectedVariant: selectedVariantSnapshot,
      quantity: qty,
      mrpPrice: qty * unitMrp,
      sellingPrice: qty * unitSelling,
      userId: userId.toString(),
      // Legacy compatibility
      size: legacyAttrs.size || "",
      ram: legacyAttrs.ram || "",
      weight: legacyAttrs.weight || "",
      capacity: legacyAttrs.capacity || "",
    });

    await newCartItem.save();
    return newCartItem;
  }

  async updateCartItemQuantity(userId, cartItemId, quantity) {
    const cartItem = await CartItem.findById(cartItemId).populate("product");
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized to update this cart item");
    }

    const newQty = Number(quantity);
    if (newQty <= 0) {
      await CartItem.findByIdAndDelete(cartItemId);
      return { message: "Item removed from cart" };
    }

    const product = cartItem.product;
    let unitMrp = product.mrpPrice;
    let unitSelling = product.sellingPrice;
    let stock = product.countInStock;

    if (cartItem.variantId && product.hasVariants) {
      const variant = product.variants.id(cartItem.variantId);
      if (variant) {
        unitMrp = variant.mrpPrice;
        unitSelling = variant.sellingPrice;
        stock = variant.countInStock;
      }
    }

    if (newQty > stock) {
      throw new Error(`Only ${stock} units available in stock.`);
    }

    cartItem.quantity = newQty;
    cartItem.mrpPrice = newQty * unitMrp;
    cartItem.sellingPrice = newQty * unitSelling;
    return await cartItem.save();
  }

  async removeCartItem(userId, cartItemId) {
    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized to remove this cart item");
    }

    await CartItem.findByIdAndDelete(cartItemId);
    return { message: "Item removed successfully" };
  }
}

export default new CartService();
