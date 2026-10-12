import mongoose from "mongoose";
import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import { Product, resolveMediaHierarchy } from "../../../models/product.model.js";
import { Coupon } from "../../../models/coupon.model.js";
import { PlatformSettings } from "../../../models/settings.model.js";
import { CartMergeRecord } from "../../../models/cartMergeRecord.model.js";
import { calculateDiscountPercentage } from "../../../utils/calculateDiscountPercentage.js";

const canQueryModel = (model, method) => {
  if (!model || typeof model[method] !== "function") return false;
  if (mongoose.connection && mongoose.connection.readyState === 1) return true;
  return model[method] !== mongoose.Model[method];
};

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
      const itemObj =
        typeof item.toObject === "function" ? item.toObject() : { ...item };
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
    // Query platform settings for dynamic threshold and delivery fee
    let freeShippingThreshold = 500;
    let standardDeliveryFee = 40;
    try {
      if (canQueryModel(PlatformSettings, "findOne")) {
        const platformSettings = await PlatformSettings.findOne();
        if (platformSettings) {
          if (typeof platformSettings.freeShippingThreshold === "number") {
            freeShippingThreshold = platformSettings.freeShippingThreshold;
          }
          if (typeof platformSettings.shippingFee === "number") {
            standardDeliveryFee = platformSettings.shippingFee;
          }
        }
      }
    } catch {
      // Fallback safely to defaults if settings store is unavailable
    }

    const isFreeShipping = totalDiscountedPrice >= freeShippingThreshold || totalItems === 0;
    const deliveryFee = isFreeShipping ? 0 : standardDeliveryFee;
    const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - totalDiscountedPrice);

    // 5. Compute Final Pricing Totals
    const finalSellingPriceAfterCoupon = Math.max(0, totalDiscountedPrice - appliedCouponPrice);
    const totalPayable = finalSellingPriceAfterCoupon + deliveryFee;
    const totalSavings = (totalPrice - finalSellingPriceAfterCoupon) + (isFreeShipping && totalPrice > 0 ? standardDeliveryFee : 0);

    cart.totalMrpPrice = totalPrice;
    cart.totalSellingPrice = finalSellingPriceAfterCoupon;
    cart.totalItem = totalItems;
    cart.discount =
      totalPrice > 0
        ? calculateDiscountPercentage(totalPrice, finalSellingPriceAfterCoupon)
        : 0;

    await cart.save();

    // 6. Return Enriched Response Object with Full Domain Intelligence
    const responsePayload =
      typeof cart.toObject === "function" ? cart.toObject() : { ...cart };
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
      freeDeliveryThreshold: freeShippingThreshold,
      amountNeededForFreeDelivery: amountNeededForFreeShipping,
      standardDeliveryFee,
    };

    return responsePayload;
  }

  async addCartItem(user, productIdOrOptions, variantId = null, quantity = 1, legacyAttrs = {}) {
    let productId = productIdOrOptions;
    if (
      productIdOrOptions &&
      typeof productIdOrOptions === "object" &&
      !productIdOrOptions._bsontype &&
      !productIdOrOptions._id &&
      !mongoose.Types.ObjectId.isValid(productIdOrOptions)
    ) {
      productId = productIdOrOptions.productId || productIdOrOptions.product;
      variantId = productIdOrOptions.variantId || null;
      quantity =
        productIdOrOptions.quantity !== undefined
          ? productIdOrOptions.quantity
          : 1;
      legacyAttrs = {
        sku: productIdOrOptions.sku,
        size: productIdOrOptions.size,
        ram: productIdOrOptions.ram,
        weight: productIdOrOptions.weight,
        capacity: productIdOrOptions.capacity,
      };
    }

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

  /**
   * Merges guest cart items into authenticated user cart upon login or checkout initialization.
   * Revalidates stock and price, combining quantities for identical product/variant items safely.
   * Never silently discards failed items. Tracks and reports merged and failed items.
   * Idempotent: duplicate retries return consistent results without doubling quantities.
   */
  async mergeGuestCart(user, guestItems = [], options = {}) {
    const userId = user._id || user;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId });
      await cart.save();
    }

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      const currentCart = await this.findUserCart(user);
      return {
        cart: currentCart,
        mergedItems: [],
        failedItems: [],
        totalProcessed: 0,
        message: "No guest items provided to merge",
      };
    }

    // Idempotency check: compute deterministic signature from guest payload including clientItemId
    const signature =
      options.idempotencyKey ||
      guestItems
        .map((i, idx) => {
          const cid = i.clientItemId || i._id || i.id || `idx_${idx}`;
          const pid = i.productId || i.product?._id || i.product || "";
          const vid = i.variantId || i.selectedVariant?._id || "";
          const qty = Number(i.quantity) || 1;
          return `${cid}:${pid}:${vid}:${qty}`;
        })
        .sort()
        .join("|");

    // Check if idempotency record exists in CartMergeRecord or recentSignatures within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentSignatures = (cart.recentMergeSignatures || []).filter(
      (s) => new Date(s.createdAt) > tenMinutesAgo
    );

    let recordedMerge = null;
    try {
      if (canQueryModel(CartMergeRecord, "findOne")) {
        recordedMerge = await CartMergeRecord.findOne({
          userId,
          idempotencyKey: signature,
        });
      }
    } catch {
      // Continue safely if standalone or mocked
    }

    if (!recordedMerge) {
      const matchInCart = recentSignatures.find((s) => s.signature === signature);
      if (matchInCart) {
        recordedMerge = matchInCart;
      }
    }

    if (
      recordedMerge &&
      (recordedMerge.status === "COMPLETED" ||
        recordedMerge.signature === signature ||
        recordedMerge.idempotencyKey === signature)
    ) {
      const currentCart = await this.findUserCart(user);
      const recordedMerged = recordedMerge.mergedItems || [];
      const recordedFailed = recordedMerge.failedItems || [];
      return {
        cart: currentCart,
        mergedItems: recordedMerged.map((m) => ({ ...m, isReplay: true })),
        failedItems: recordedFailed,
        totalProcessed:
          recordedMerge.totalProcessed !== undefined
            ? recordedMerge.totalProcessed
            : guestItems.length,
        isIdempotentReplay: true,
        message: "Guest cart merge already processed (idempotent replay)",
      };
    }

    const mergedItems = [];
    const failedItems = [];

    for (const item of guestItems) {
      const prodId = item.productId || item.product?._id || item.product;
      const requestedVariantId =
        item.variantId || item.selectedVariant?._id || null;
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const clientItemId = item._id || item.clientItemId || null;

      if (!prodId) {
        failedItems.push({
          item,
          reason: "Missing product identifier in guest cart item",
          clientItemId,
        });
        continue;
      }

      let product;
      try {
        product = await Product.findById(prodId);
      } catch (err) {
        failedItems.push({
          item,
          productId: prodId,
          reason: `Invalid product reference: ${err.message}`,
          clientItemId,
        });
        continue;
      }

      if (!product) {
        failedItems.push({
          item,
          productId: prodId,
          reason: "Product no longer exists in catalog",
          clientItemId,
        });
        continue;
      }

      if (product.status && product.status !== "PUBLISHED") {
        failedItems.push({
          item,
          productId: prodId,
          title: product.title,
          reason: "Product is currently unpublished or inactive",
          clientItemId,
        });
        continue;
      }

      let unitMrp = product.mrpPrice;
      let unitSelling = product.sellingPrice;
      let availableStock = product.countInStock || 0;
      let resolvedVariant = null;
      let selectedVariantSnapshot = {
        sku: product.sku || "",
        title: product.title || "",
        attributes: [],
        image: product.images?.[0] || "",
      };

      if (product.hasVariants && product.variants?.length > 0) {
        if (requestedVariantId) {
          resolvedVariant = product.variants.id(requestedVariantId);
        }

        if (!resolvedVariant && item.sku) {
          resolvedVariant = product.variants.find((v) => v.sku === item.sku);
        }

        if (!resolvedVariant && (item.size || item.ram || item.capacity)) {
          resolvedVariant = product.variants.find((v) =>
            v.attributes?.some(
              (a) =>
                (item.size && a.value === item.size) ||
                (item.ram && a.value === item.ram) ||
                (item.capacity && a.value === item.capacity)
            )
          );
        }

        if (!resolvedVariant) {
          resolvedVariant =
            product.variants.find((v) => v.status === "ACTIVE") ||
            product.variants[0];
        }

        if (!resolvedVariant) {
          failedItems.push({
            item,
            productId: prodId,
            title: product.title,
            reason: "Selected product variant is unavailable",
            clientItemId,
          });
          continue;
        }

        if (resolvedVariant.status && resolvedVariant.status !== "ACTIVE") {
          failedItems.push({
            item,
            productId: prodId,
            title: product.title,
            reason: "Selected variant is currently inactive",
            clientItemId,
          });
          continue;
        }

        unitMrp = resolvedVariant.mrpPrice;
        unitSelling = resolvedVariant.sellingPrice;
        availableStock =
          resolvedVariant.countInStock !== undefined
            ? resolvedVariant.countInStock
            : 0;

        const resolvedMedia = resolveMediaHierarchy(product, resolvedVariant, {});
        selectedVariantSnapshot = {
          sku: resolvedVariant.sku || "",
          title: resolvedVariant.title || "",
          attributes: resolvedVariant.attributes || [],
          image:
            resolvedMedia[0] ||
            resolvedVariant.images?.[0] ||
            product.images?.[0] ||
            "",
        };
      }

      if (availableStock <= 0) {
        failedItems.push({
          item,
          productId: prodId,
          title: product.title,
          reason: "Item is currently out of stock",
          clientItemId,
        });
        continue;
      }

      const query = {
        cart: cart._id,
        product: product._id,
        variantId: resolvedVariant ? resolvedVariant._id : null,
      };

      let existingItem = await CartItem.findOne(query);

      if (existingItem) {
        const currentQty = existingItem.quantity || 0;
        const combinedQty = currentQty + requestedQty;
        const safeQty = Math.min(combinedQty, availableStock);

        if (safeQty <= currentQty) {
          failedItems.push({
            item,
            productId: prodId,
            title: product.title,
            reason: `Maximum available inventory (${availableStock}) is already in your cart`,
            clientItemId,
          });
          continue;
        }

        const quantityMerged = safeQty - currentQty;
        existingItem.quantity = safeQty;
        existingItem.mrpPrice = safeQty * unitMrp;
        existingItem.sellingPrice = safeQty * unitSelling;
        await existingItem.save();

        mergedItems.push({
          productId: prodId,
          variantId: resolvedVariant ? resolvedVariant._id : null,
          quantityMerged,
          finalQuantity: safeQty,
          clientItemId,
          partialStockApplied: safeQty < combinedQty,
        });
      } else {
        const safeQty = Math.min(requestedQty, availableStock);
        const newCartItem = new CartItem({
          cart: cart._id,
          product: product._id,
          variantId: resolvedVariant ? resolvedVariant._id : null,
          selectedVariant: selectedVariantSnapshot,
          quantity: safeQty,
          mrpPrice: safeQty * unitMrp,
          sellingPrice: safeQty * unitSelling,
          userId: userId.toString(),
          size: item.size || "",
          ram: item.ram || "",
          weight: item.weight || "",
          capacity: item.capacity || "",
        });

        await newCartItem.save();

        mergedItems.push({
          productId: prodId,
          variantId: resolvedVariant ? resolvedVariant._id : null,
          quantityMerged: safeQty,
          finalQuantity: safeQty,
          clientItemId,
          partialStockApplied: safeQty < requestedQty,
        });
      }
    }

    const totalProcessed = guestItems.length;

    // Persist idempotency signature and accurate outcomes
    try {
      if (canQueryModel(CartMergeRecord, "findOneAndUpdate")) {
        await CartMergeRecord.findOneAndUpdate(
          { userId, idempotencyKey: signature },
          {
            $set: {
              status: "COMPLETED",
              mergedItems,
              failedItems,
              totalProcessed,
            },
          },
          { upsert: true, new: true }
        ).catch(() => {});
      }
    } catch {
      // Continue safely
    }

    if (signature) {
      recentSignatures.push({
        signature,
        mergedItems,
        failedItems,
        totalProcessed,
        createdAt: new Date(),
      });
      cart.recentMergeSignatures = recentSignatures.slice(-20);
      await cart.save();
    }

    const updatedCart = await this.findUserCart(user);
    return {
      cart: updatedCart,
      mergedItems,
      failedItems,
      totalProcessed: guestItems.length,
      message:
        failedItems.length > 0 && mergedItems.length === 0
          ? "Unable to merge any guest items due to availability"
          : failedItems.length > 0
          ? "Guest cart partially merged"
          : "Guest cart merged successfully",
    };
  }
}

export default new CartService();
