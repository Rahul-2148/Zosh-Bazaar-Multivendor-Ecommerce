import { PriceHistory } from "../../models/priceHistory.model.js";
import { PriceAlert } from "../../models/priceAlert.model.js";
import { Product } from "../../models/product.model.js";
import { Notification } from "../../models/notification.model.js";

class PriceIntelligenceService {
  /**
   * Records a point-in-time price snapshot whenever a product or variant price changes.
   */
  async recordPriceSnapshot({ productId, variantSku = null, sellingPrice, mrpPrice, discountPercent, source = "SELLER_UPDATE" }) {
    try {
      const entry = await PriceHistory.create({
        product: productId,
        variantSku,
        sellingPrice,
        mrpPrice,
        discountPercent: discountPercent || Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100),
        source,
        timestamp: new Date(),
      });

      // Check if any customer price alerts are triggered by this price change
      await this.evaluatePriceAlerts(productId, sellingPrice);

      return entry;
    } catch (err) {
      console.error("[PriceIntelligence] Error recording price snapshot:", err);
      return null;
    }
  }

  /**
   * Retrieves historical price trend over 30d/90d for charts and displays.
   */
  async getPriceHistory(productId, daysOrOptions = 90) {
    const days = typeof daysOrOptions === "object" ? Number(daysOrOptions?.days) || 90 : Number(daysOrOptions) || 90;
    const requestedVariantId = typeof daysOrOptions === "object" ? daysOrOptions?.variantId || null : null;
    const requestedVariantSku = typeof daysOrOptions === "object" ? daysOrOptions?.variantSku || null : null;

    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new Error("Product not found");
    }

    let resolvedVariant = null;
    if (requestedVariantId && Array.isArray(product.variants)) {
      resolvedVariant = product.variants.find(
        (v) => (v._id && v._id.toString() === requestedVariantId.toString()) || v.sku === requestedVariantId
      );
    } else if (requestedVariantSku && Array.isArray(product.variants)) {
      resolvedVariant = product.variants.find((v) => v.sku === requestedVariantSku);
    }

    if ((requestedVariantId || requestedVariantSku) && !resolvedVariant) {
      throw new Error("Specified variant not found for this product");
    }

    const currentPrice = resolvedVariant ? resolvedVariant.sellingPrice : product.sellingPrice;
    const mrpPrice = resolvedVariant ? resolvedVariant.mrpPrice : product.mrpPrice;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = {
      product: productId,
      timestamp: { $gte: cutoff },
    };

    if (resolvedVariant) {
      filter.variantId = resolvedVariant._id;
    } else {
      filter.variantId = null;
    }

    const history = await PriceHistory.find(filter)
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();

    // Return chronologically for chart
    history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Build points strictly from authentic historical snapshots
    if (history.length === 0) {
      return {
        productId,
        variantId: resolvedVariant?._id ? resolvedVariant._id.toString() : requestedVariantId,
        variantSku: resolvedVariant?.sku || requestedVariantSku,
        title: product.title,
        currentPrice,
        mrpPrice,
        lowestPrice: null,
        highestPrice: null,
        averagePrice: null,
        priceDropPercent: 0,
        trend: "STABLE",
        points: [],
        currency: "INR",
        daysAnalyzed: days,
        hasSufficientHistory: false,
      };
    }

    const points = history.map((h) => ({
      date: h.timestamp.toISOString().split("T")[0],
      timestamp: h.timestamp,
      price: h.sellingPrice,
      mrp: h.mrpPrice,
    }));

    const prices = points.map((p) => p.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    const hasSufficientHistory = history.length >= 2;

    const priceDropPercent =
      hasSufficientHistory && highestPrice > currentPrice
        ? Math.round(((highestPrice - currentPrice) / highestPrice) * 100)
        : 0;

    let trend = "STABLE";
    if (hasSufficientHistory && prices.length >= 2) {
      const first = prices[0];
      const last = prices[prices.length - 1];
      if (last < first * 0.97) trend = "FALLING";
      else if (last > first * 1.03) trend = "RISING";
    }

    return {
      productId,
      variantId: resolvedVariant?._id ? resolvedVariant._id.toString() : requestedVariantId,
      variantSku: resolvedVariant?.sku || requestedVariantSku,
      title: product.title,
      currentPrice,
      mrpPrice,
      lowestPrice: hasSufficientHistory ? lowestPrice : null,
      highestPrice: hasSufficientHistory ? highestPrice : null,
      averagePrice: hasSufficientHistory ? avgPrice : null,
      priceDropPercent,
      trend,
      points,
      currency: "INR",
      daysAnalyzed: days,
      hasSufficientHistory,
    };
  }

  /**
   * Registers a customer price drop alert with optional Safe Auto-Buy policy.
   */
  async createPriceAlert(userId, { productId, targetPrice, channels = ["IN_APP", "EMAIL"], autoBuyPolicy = null }) {
    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new Error("Product not found");
    }

    if (targetPrice >= product.sellingPrice) {
      throw new Error("Target price must be lower than the current selling price");
    }

    // Deactivate existing alerts for same user and product
    await PriceAlert.updateMany(
      { user: userId, product: productId, status: "ACTIVE" },
      { $set: { status: "CANCELLED" } }
    );

    const alert = await PriceAlert.create({
      user: userId,
      product: productId,
      targetPrice,
      priceAtCreation: product.sellingPrice,
      status: "ACTIVE",
      channels,
      autoBuyPolicy: autoBuyPolicy
        ? {
            enabled: Boolean(autoBuyPolicy.enabled),
            maxAuthorizedPrice: autoBuyPolicy.maxAuthorizedPrice || targetPrice,
            deliveryAddress: autoBuyPolicy.deliveryAddress || null,
            quantityLimit: autoBuyPolicy.quantityLimit || 1,
            paymentMethodType: autoBuyPolicy.paymentMethodType || "ONE_CLICK_COD",
            userConsentTimestamp: new Date(),
            status: "AUTHORIZED",
          }
        : null,
    });

    return alert;
  }

  /**
   * Lists all active or past price alerts for a user.
   */
  async getUserPriceAlerts(userId) {
    return await PriceAlert.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("product", "title images sellingPrice mrpPrice inStock brand")
      .lean();
  }

  /**
   * Cancels a user's price alert.
   */
  async cancelPriceAlert(userId, alertId) {
    const alert = await PriceAlert.findOneAndUpdate(
      { _id: alertId, user: userId },
      { $set: { status: "CANCELLED" } },
      { new: true }
    );
    if (!alert) {
      throw new Error("Alert not found or unauthorized");
    }
    return alert;
  }

  /**
   * Evaluates active alerts and triggers notifications/actions when price drops.
   */
  async evaluatePriceAlerts(productId, newPrice) {
    const activeAlerts = await PriceAlert.find({
      product: productId,
      status: "ACTIVE",
      targetPrice: { $gte: newPrice },
    }).populate("product", "title sellingPrice");

    for (const alert of activeAlerts) {
      alert.status = "TRIGGERED";
      alert.triggeredAt = new Date();
      alert.triggeredPrice = newPrice;
      await alert.save();

      // Create high-priority in-app notification
      await Notification.create({
        user: alert.user,
        title: "⚡ Price Drop Alert Triggered!",
        message: `Great news! "${alert.product?.title?.slice(0, 40)}" dropped to ₹${newPrice.toLocaleString("en-IN")}, reaching your target of ₹${alert.targetPrice.toLocaleString("en-IN")}.`,
        type: "PRICE_DROP",
        data: {
          productId: alert.product?._id,
          targetPrice: alert.targetPrice,
          newPrice,
          autoBuyAuthorized: Boolean(alert.autoBuyPolicy?.enabled),
        },
      }).catch((e) => console.error("Error creating price notification:", e));

      // Handle Safe Auto-Buy authorization policy
      if (alert.autoBuyPolicy && alert.autoBuyPolicy.enabled) {
        console.log(
          `[Safe Auto-Buy] User ${alert.user} authorized auto-buy for product ${productId} at ₹${newPrice} (Max: ₹${alert.autoBuyPolicy.maxAuthorizedPrice})`
        );
        // We log the authorized opportunity and prepare verified one-click dispatch
        alert.autoBuyPolicy.status = "EXECUTED";
        await alert.save();
      }
    }

    return { evaluated: activeAlerts.length };
  }
}

export const priceIntelligenceService = new PriceIntelligenceService();
export default priceIntelligenceService;
