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

      let currentUnitMrp = typeof prod.mrpPrice === "number" ? prod.mrpPrice : Math.round((item.mrpPrice || 0) / Math.max(1, item.quantity));
      let currentUnitSelling = typeof prod.sellingPrice === "number" ? prod.sellingPrice : Math.round((item.sellingPrice || 0) / Math.max(1, item.quantity));
      let currentStock = prod.countInStock || 0;
      let isVariantActive = true;
      let matchedVariant = null;

      if (item.variantId && prod.hasVariants && Array.isArray(prod.variants)) {
        matchedVariant = prod.variants.id(item.variantId);
        if (matchedVariant) {
          currentUnitMrp = typeof matchedVariant.mrpPrice === "number" ? matchedVariant.mrpPrice : currentUnitMrp;
          currentUnitSelling = typeof matchedVariant.sellingPrice === "number" ? matchedVariant.sellingPrice : currentUnitSelling;
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
      if (typeof currentUnitSelling === "number" && currentUnitSelling !== prevUnitSelling) {
        const priceDiff = currentUnitSelling - prevUnitSelling;
        validationWarnings.push({
          type: "PRICE_CHANGED",
          productId: prod._id,
          title: prod.title || "Product",
          oldPrice: prevUnitSelling,
          newPrice: currentUnitSelling,
          diff: priceDiff,
          message: `Price for "${prod.title || "Item"}" changed from ₹${(prevUnitSelling || 0).toLocaleString("en-IN")} to ₹${(currentUnitSelling || 0).toLocaleString("en-IN")}.`,
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

    let mergeRecord = null;
    const modelCanQuery = canQueryModel(CartMergeRecord, "create") || canQueryModel(CartMergeRecord, "findOne");
    const lockWorkerId =
      options.lockWorkerId ||
      `w_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const isExplicitRetry = Boolean(
      options.isRetry ||
      options.retryFailed ||
      options.retryMode === "FAILED_ITEMS" ||
      (options.attempt && options.attempt > 1)
    );

    if (modelCanQuery) {
      try {
        mergeRecord = await CartMergeRecord.create({
          userId,
          idempotencyKey: signature,
          status: "IN_PROGRESS",
          lockedAt: new Date(),
          lockWorkerId,
          totalProcessed: guestItems.length,
          mergedItems: [],
          failedItems: [],
          attempt: options.attempt || 1,
          retryMode: options.retryMode || (isExplicitRetry ? "FAILED_ITEMS" : "NONE"),
        });
      } catch (createErr) {
        const isDuplicateKey =
          createErr.code === 11000 ||
          (createErr.name === "MongoServerError" && createErr.code === 11000) ||
          /E11000 duplicate key|duplicate key error/i.test(createErr.message);

        if (!isDuplicateKey) {
          // Unexpected database error during reservation: FAIL CLOSED!
          throw createErr;
        }

        const existing = await CartMergeRecord.findOne({
          userId,
          idempotencyKey: signature,
        });

        if (existing) {
          if (existing.status === "COMPLETED") {
            const hasFailedOrPartial =
              (existing.failedItems && existing.failedItems.length > 0) ||
              (existing.mergedItems &&
                existing.mergedItems.some(
                  (m) =>
                    m.partialStockApplied ||
                    (m.remainingQuantity && m.remainingQuantity > 0)
                ));

            if (!isExplicitRetry || !hasFailedOrPartial) {
              const currentCart = await this.findUserCart(user);
              return {
                cart: currentCart,
                mergedItems: (existing.mergedItems || []).map((m) => ({
                  ...m,
                  isReplay: true,
                })),
                failedItems: existing.failedItems || [],
                totalProcessed:
                  existing.totalProcessed !== undefined
                    ? existing.totalProcessed
                    : guestItems.length,
                isIdempotentReplay: true,
                message: "Guest cart merge already processed (idempotent replay)",
              };
            }

            // Explicit retry: atomic conditional claim of the completed record
            const claimed = await CartMergeRecord.findOneAndUpdate(
              {
                userId,
                idempotencyKey: signature,
                status: "COMPLETED",
              },
              {
                $set: {
                  status: "IN_PROGRESS",
                  lockedAt: new Date(),
                  lockWorkerId,
                  retryMode: options.retryMode || "FAILED_ITEMS",
                },
                $inc: { attempt: 1 },
              },
              { new: true }
            );

            if (!claimed) {
              const conflictError = new Error(
                "Guest cart merge retry is currently being processed by another worker."
              );
              conflictError.statusCode = 409;
              conflictError.code = "MERGE_IN_PROGRESS";
              throw conflictError;
            }
            mergeRecord = claimed;
          } else if (existing.status === "IN_PROGRESS") {
            const lockTime = new Date(
              existing.lockedAt || existing.updatedAt || existing.createdAt
            ).getTime();
            const recordAgeMs = Date.now() - lockTime;

            if (recordAgeMs < 60000) {
              const conflictError = new Error(
                "Guest cart merge is currently in progress. Please retry shortly."
              );
              conflictError.statusCode = 409;
              conflictError.code = "MERGE_IN_PROGRESS";
              throw conflictError;
            }

            // Stale in-progress reservation (> 60s): atomic conditional claim
            const claimed = await CartMergeRecord.findOneAndUpdate(
              {
                userId,
                idempotencyKey: signature,
                status: "IN_PROGRESS",
                lockedAt: existing.lockedAt,
              },
              {
                $set: {
                  status: "IN_PROGRESS",
                  lockedAt: new Date(),
                  lockWorkerId,
                },
                $inc: { attempt: 1 },
              },
              { new: true }
            );

            if (!claimed) {
              const conflictError = new Error(
                "Guest cart merge is currently in progress. Please retry shortly."
              );
              conflictError.statusCode = 409;
              conflictError.code = "MERGE_IN_PROGRESS";
              throw conflictError;
            }
            mergeRecord = claimed;
          } else if (existing.status === "FAILED") {
            // Atomic conditional claim of the failed record
            const claimed = await CartMergeRecord.findOneAndUpdate(
              {
                userId,
                idempotencyKey: signature,
                status: "FAILED",
              },
              {
                $set: {
                  status: "IN_PROGRESS",
                  lockedAt: new Date(),
                  lockWorkerId,
                },
                $inc: { attempt: 1 },
              },
              { new: true }
            );

            if (!claimed) {
              const conflictError = new Error(
                "Guest cart merge retry is currently being processed by another worker."
              );
              conflictError.statusCode = 409;
              conflictError.code = "MERGE_IN_PROGRESS";
              throw conflictError;
            }
            mergeRecord = claimed;
          }
        }
      }
    }

    if (modelCanQuery && !mergeRecord) {
      const lockError = new Error("Unable to establish durable cart merge reservation. Merge aborted.");
      lockError.statusCode = 503;
      lockError.code = "RESERVATION_FAILED";
      throw lockError;
    }

    if (!mergeRecord) {
      const matchInCart = recentSignatures.find((s) => s.signature === signature);
      if (matchInCart && (matchInCart.status === "COMPLETED" || !matchInCart.status)) {
        const currentCart = await this.findUserCart(user);
        return {
          cart: currentCart,
          mergedItems: (matchInCart.mergedItems || []).map((m) => ({ ...m, isReplay: true })),
          failedItems: matchInCart.failedItems || [],
          totalProcessed:
            matchInCart.totalProcessed !== undefined
              ? matchInCart.totalProcessed
              : guestItems.length,
          isIdempotentReplay: true,
          message: "Guest cart merge already processed (idempotent replay)",
        };
      }
    }

    const previouslyMergedMap = new Map();
    if (mergeRecord && Array.isArray(mergeRecord.mergedItems)) {
      mergeRecord.mergedItems.forEach((mi) => {
        if (mi.clientItemId) {
          previouslyMergedMap.set(String(mi.clientItemId), { ...mi });
        }
      });
    }

    // Pre-crash recovery: discover if any guest item was already persisted to CartItem before a worker crash for THIS merge signature
    try {
      if (canQueryModel(CartItem, "find")) {
        const existingCartItems = await CartItem.find({ cart: cart._id });
        if (Array.isArray(existingCartItems)) {
          for (const ci of existingCartItems) {
            // 1. Structured appliedGuestItems
            if (Array.isArray(ci.appliedGuestItems)) {
              for (const itemEntry of ci.appliedGuestItems) {
                if (itemEntry && itemEntry.signature === signature && itemEntry.clientItemId) {
                  const cId = String(itemEntry.clientItemId);
                  if (!previouslyMergedMap.has(cId)) {
                    const qApplied = Number(itemEntry.quantityApplied) || 0;
                    const remQty = Number(itemEntry.remainingQuantity) || 0;
                    previouslyMergedMap.set(cId, {
                      productId: ci.product,
                      variantId: ci.variantId,
                      quantityMerged: qApplied,
                      remainingQuantity: remQty,
                      finalQuantity: ci.quantity,
                      clientItemId: cId,
                      partialStockApplied: remQty > 0,
                      recoveredFromInterruptedRun: true,
                    });
                  }
                }
              }
            }

            // 2. String encoded appliedGuestItemIds fallback
            if (Array.isArray(ci.appliedGuestItemIds)) {
              for (const entry of ci.appliedGuestItemIds) {
                const entryStr = String(entry);
                if (entryStr.startsWith(`${signature}:`)) {
                  const rest = entryStr.substring(signature.length + 1);
                  const parts = rest.split(":");
                  const cId = parts[0];
                  if (cId && !previouslyMergedMap.has(String(cId))) {
                    let qApplied = parts.length >= 2 ? Number(parts[1]) : null;
                    let remQty = parts.length >= 3 ? Number(parts[2]) : null;

                    if (qApplied === null || isNaN(qApplied)) {
                      // Legacy or unencoded format without quantities:
                      // Recover from actual persisted cart item quantity capped by requested
                      const matchedGuest = guestItems.find(
                        (gi, idx) => (gi.clientItemId || gi._id || gi.id || `idx_${idx}`) === cId
                      );
                      const reqQ = matchedGuest ? Number(matchedGuest.quantity) || 1 : 1;
                      qApplied = Math.min(ci.quantity || 1, reqQ);
                      remQty = Math.max(0, reqQ - qApplied);
                    }

                    previouslyMergedMap.set(String(cId), {
                      productId: ci.product,
                      variantId: ci.variantId,
                      quantityMerged: qApplied,
                      remainingQuantity: remQty || 0,
                      finalQuantity: ci.quantity,
                      clientItemId: String(cId),
                      partialStockApplied: (remQty || 0) > 0,
                      recoveredFromInterruptedRun: true,
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch (lookupErr) {
      if (mergeRecord) {
        try {
          mergeRecord.status = "FAILED";
          mergeRecord.failedItems = [
            { reason: `Database recovery lookup failed: ${lookupErr.message}` },
          ];
          await mergeRecord.save();
        } catch {}
      }
      const recoveryError = new Error(
        `Failed to verify prior cart state during recovery: ${lookupErr.message}`
      );
      recoveryError.statusCode = 500;
      recoveryError.code = "RECOVERY_LOOKUP_FAILED";
      throw recoveryError;
    }

    const mergedItems = [];
    const failedItems = [];

    try {
      for (let idx = 0; idx < guestItems.length; idx++) {
        const item = guestItems[idx];
        const prodId = item.productId || item.product?._id || item.product;
        const requestedVariantId =
          item.variantId || item.selectedVariant?._id || null;
        const requestedQty = Math.max(1, Number(item.quantity) || 1);
        const clientItemId =
          item.clientItemId || item._id || item.id || `idx_${idx}`;

        const prior =
          clientItemId && previouslyMergedMap.has(String(clientItemId))
            ? previouslyMergedMap.get(String(clientItemId))
            : null;
        const priorMergedQty = prior ? Number(prior.quantityMerged) || 0 : 0;

        // A retry item is a remainder retry when it was stock-capped in a prior attempt and requests unmerged units
        const isRemainderRetry = Boolean(
          item.partialStockApplied ||
          (prior &&
            prior.remainingQuantity > 0 &&
            (requestedQty === prior.remainingQuantity || requestedQty <= prior.remainingQuantity) &&
            (options.isRetry || options.retryFailed || options.retryMode === "FAILED_ITEMS"))
        );

        let neededQty = 0;
        if (isRemainderRetry) {
          neededQty = requestedQty;
        } else {
          if (priorMergedQty >= requestedQty) {
            mergedItems.push(prior);
            continue;
          }
          neededQty = requestedQty - priorMergedQty;
        }

        if (!prodId) {
          failedItems.push({
            item,
            reason: "Missing product identifier in guest cart item",
            clientItemId,
            requestedQuantity: requestedQty,
            remainingQuantity: neededQty,
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
            requestedQuantity: requestedQty,
            remainingQuantity: neededQty,
          });
          continue;
        }

        if (!product) {
          failedItems.push({
            item,
            productId: prodId,
            reason: "Product no longer exists in catalog",
            clientItemId,
            requestedQuantity: requestedQty,
            remainingQuantity: neededQty,
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
            requestedQuantity: requestedQty,
            remainingQuantity: neededQty,
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
              requestedQuantity: requestedQty,
              remainingQuantity: neededQty,
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
              requestedQuantity: requestedQty,
              remainingQuantity: neededQty,
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
            requestedQuantity: requestedQty,
            remainingQuantity: neededQty,
          });
          continue;
        }

        const query = {
          cart: cart._id,
          product: product._id,
          variantId: resolvedVariant ? resolvedVariant._id : null,
        };

        let itemPersisted = false;
        let mutationAttempts = 0;
        const maxMutationAttempts = 5;

        while (!itemPersisted && mutationAttempts < maxMutationAttempts) {
          mutationAttempts++;
          let existingItem = await CartItem.findOne(query);

          if (existingItem) {
            const currentQty = existingItem.quantity || 0;
            const combinedQty = currentQty + neededQty;
            const safeQty = Math.min(combinedQty, availableStock);

            if (safeQty <= currentQty) {
              if (prior && prior.recoveredFromInterruptedRun) {
                mergedItems.push(prior);
              } else {
                failedItems.push({
                  item,
                  productId: prodId,
                  title: product.title,
                  reason: `Maximum available inventory (${availableStock}) is already in your cart`,
                  clientItemId,
                  requestedQuantity: requestedQty,
                  remainingQuantity: neededQty,
                });
              }
              itemPersisted = true;
              break;
            }

            const quantityNewlyMerged = safeQty - currentQty;
            const totalMergedForThisItem = priorMergedQty + quantityNewlyMerged;
            const unmergedRemainder = isRemainderRetry
              ? Math.max(0, requestedQty - quantityNewlyMerged)
              : Math.max(0, requestedQty - totalMergedForThisItem);

            const scopedKey = `${signature}:${clientItemId}`;
            const detailedKey = `${signature}:${clientItemId}:${totalMergedForThisItem}:${unmergedRemainder}`;
            const guestItemEntry = {
              signature,
              clientItemId: String(clientItemId),
              quantityApplied: totalMergedForThisItem,
              remainingQuantity: unmergedRemainder,
              appliedAt: new Date(),
            };

            existingItem.quantity = safeQty;
            existingItem.mrpPrice = safeQty * unitMrp;
            existingItem.sellingPrice = safeQty * unitSelling;

            existingItem.appliedGuestItems = existingItem.appliedGuestItems || [];
            if (clientItemId) {
              const entryIdx = existingItem.appliedGuestItems.findIndex(
                (e) => e.signature === signature && e.clientItemId === String(clientItemId)
              );
              if (entryIdx >= 0) {
                existingItem.appliedGuestItems[entryIdx].quantityApplied = totalMergedForThisItem;
                existingItem.appliedGuestItems[entryIdx].remainingQuantity = unmergedRemainder;
              } else {
                existingItem.appliedGuestItems.push(guestItemEntry);
              }
            }

            existingItem.appliedGuestItemIds = existingItem.appliedGuestItemIds || [];
            if (clientItemId && !existingItem.appliedGuestItemIds.includes(scopedKey)) {
              existingItem.appliedGuestItemIds.push(scopedKey);
            }
            if (clientItemId && !existingItem.appliedGuestItemIds.includes(detailedKey)) {
              existingItem.appliedGuestItemIds.push(detailedKey);
            }

            try {
              await existingItem.save();
              itemPersisted = true;
              mergedItems.push({
                productId: prodId,
                variantId: resolvedVariant ? resolvedVariant._id : null,
                quantityMerged: totalMergedForThisItem,
                remainingQuantity: unmergedRemainder,
                finalQuantity: safeQty,
                clientItemId,
                partialStockApplied: unmergedRemainder > 0,
              });
            } catch (saveErr) {
              if (saveErr.name === "VersionError" || saveErr.code === 11000) {
                continue;
              }
              throw saveErr;
            }
          } else {
            const safeQty = Math.min(neededQty, availableStock);
            const totalMergedForThisItem = priorMergedQty + safeQty;
            const unmergedRemainder = isRemainderRetry
              ? Math.max(0, requestedQty - safeQty)
              : Math.max(0, requestedQty - totalMergedForThisItem);

            const newCartItem = new CartItem({
              cart: cart._id,
              product: product._id,
              variantId: resolvedVariant ? resolvedVariant._id : null,
              selectedVariant: selectedVariantSnapshot,
              quantity: safeQty,
              mrpPrice: safeQty * unitMrp,
              sellingPrice: safeQty * unitSelling,
              userId: userId.toString(),
              appliedGuestItems: clientItemId
                ? [
                    {
                      signature,
                      clientItemId: String(clientItemId),
                      quantityApplied: totalMergedForThisItem,
                      remainingQuantity: unmergedRemainder,
                      appliedAt: new Date(),
                    },
                  ]
                : [],
              appliedGuestItemIds: clientItemId
                ? [
                    `${signature}:${clientItemId}`,
                    `${signature}:${clientItemId}:${totalMergedForThisItem}:${unmergedRemainder}`,
                  ]
                : [],
              size: item.size || "",
              ram: item.ram || "",
              weight: item.weight || "",
              capacity: item.capacity || "",
            });

            try {
              await newCartItem.save();
              itemPersisted = true;
              mergedItems.push({
                productId: prodId,
                variantId: resolvedVariant ? resolvedVariant._id : null,
                quantityMerged: totalMergedForThisItem,
                remainingQuantity: unmergedRemainder,
                finalQuantity: safeQty,
                clientItemId,
                partialStockApplied: unmergedRemainder > 0,
              });
            } catch (insertErr) {
              if (insertErr.code === 11000 || (insertErr.message && insertErr.message.includes("E11000"))) {
                // A concurrent worker inserted the CartItem row first!
                // Loop to update the existing item atomically instead of creating a duplicate row.
                continue;
              }
              throw insertErr;
            }
          }
        }
      }
    } catch (processError) {
      if (mergeRecord) {
        try {
          mergeRecord.status = "FAILED";
          mergeRecord.mergedItems = mergedItems;
          mergeRecord.failedItems =
            failedItems.length > 0 ? failedItems : [{ reason: processError.message }];
          await mergeRecord.save();
        } catch {}
      }
      throw processError;
    }

    const totalProcessed = guestItems.length;

    // Persist idempotency signature and accurate outcomes
    try {
      if (mergeRecord) {
        mergeRecord.status = "COMPLETED";
        mergeRecord.mergedItems = mergedItems;
        mergeRecord.failedItems = failedItems;
        mergeRecord.totalProcessed = totalProcessed;
        mergeRecord.lockWorkerId = null;
        await mergeRecord.save();
      } else if (canQueryModel(CartMergeRecord, "findOneAndUpdate")) {
        await CartMergeRecord.findOneAndUpdate(
          { userId, idempotencyKey: signature },
          {
            $set: {
              status: "COMPLETED",
              mergedItems,
              failedItems,
              totalProcessed,
              lockWorkerId: null,
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (saveErr) {
      console.error("[CartService] Failed to persist merge completion:", saveErr.message);
      throw saveErr;
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
