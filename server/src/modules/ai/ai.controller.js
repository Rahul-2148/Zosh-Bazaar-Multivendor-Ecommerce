import { aiService } from "./ai.service.js";

export const getHomeRecommendations = async (req, res, next) => {
  try {
    const { limit = 10, placement = "home_for_you", sessionId } = req.query;
    const userId = req.user?._id ? String(req.user._id) : req.query.userId;

    const data = await aiService.getHomeRecommendations({
      userId,
      sessionId,
      limit: parseInt(limit, 10),
      placement,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductRecommendations = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit = 6, placement = "pdp_similar", sessionId } = req.query;
    const userId = req.user?._id ? String(req.user._id) : req.query.userId;

    const data = await aiService.getProductRecommendations({
      productId,
      placement,
      limit: parseInt(limit, 10),
      userId,
      sessionId,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

export const getCartRecommendations = async (req, res, next) => {
  try {
    const { productIds = "", limit = 4, sessionId } = req.query;
    const userId = req.user?._id ? String(req.user._id) : req.query.userId;
    const pids = productIds.split(",").filter(Boolean);

    const data = await aiService.getCartRecommendations({
      productIds: pids,
      limit: parseInt(limit, 10),
      userId,
      sessionId,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

export const ingestEvents = async (req, res, next) => {
  try {
    const events = Array.isArray(req.body.events)
      ? req.body.events
      : req.body.eventId
      ? [req.body]
      : [];

    const result = await aiService.ingestEvents(events);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const chatAssistant = async (req, res, next) => {
  try {
    const userId = req.user?._id ? String(req.user._id) : req.body.userId;
    const response = await aiService.chatAssistant({
      ...req.body,
      userId,
    });

    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (err) {
    next(err);
  }
};

export const getPriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { days = 90 } = req.query;
    const data = await aiService.getPriceHistory(productId, parseInt(days, 10));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const createPriceAlert = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User authentication required to set price alert" });
    }
    const alert = await aiService.createPriceAlert(userId, req.body);
    return res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

export const getUserPriceAlerts = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User authentication required" });
    }
    const alerts = await aiService.getUserPriceAlerts(userId);
    return res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    next(err);
  }
};

export const cancelPriceAlert = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { alertId } = req.params;
    const alert = await aiService.cancelPriceAlert(userId, alertId);
    return res.status(200).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

export const getReviewSummary = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const data = await aiService.getReviewSummary(productId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const visualSearch = async (req, res, next) => {
  try {
    const data = await aiService.visualSearch(req.body);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getBuyingGuide = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const data = await aiService.getBuyingGuide(categoryId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getSellerInsights = async (req, res, next) => {
  try {
    const sellerId = req.seller?._id || req.user?._id || req.query.sellerId;
    const data = await aiService.getSellerInsights(sellerId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const optimizeListing = async (req, res, next) => {
  try {
    const data = await aiService.optimizeListing(req.body);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const simulatePricing = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const data = await aiService.simulatePricing(productId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const forecastInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { horizonDays = 30 } = req.query;
    const data = await aiService.forecastInventory(productId, parseInt(horizonDays, 10));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const queryAdminCopilot = async (req, res, next) => {
  try {
    const data = await aiService.queryAdminCopilot(req.body);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getRecommendationExplorer = async (req, res, next) => {
  try {
    const data = await aiService.getRecommendationExplorer(req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getAdminObservability = async (req, res, next) => {
  try {
    const data = await aiService.getAdminObservability();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getLogisticsRiskShipments = async (req, res, next) => {
  try {
    const data = await aiService.getLogisticsRiskShipments();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryStopAssistance = async (req, res, next) => {
  try {
    const { riderId } = req.query;
    const data = await aiService.getDeliveryStopAssistance(riderId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const resetUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User authentication required" });
    }
    const data = await aiService.resetUserProfile(userId);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export default {
  getHomeRecommendations,
  getProductRecommendations,
  getCartRecommendations,
  ingestEvents,
  chatAssistant,
  getPriceHistory,
  createPriceAlert,
  getUserPriceAlerts,
  cancelPriceAlert,
  getReviewSummary,
  visualSearch,
  getBuyingGuide,
  getSellerInsights,
  optimizeListing,
  simulatePricing,
  forecastInventory,
  queryAdminCopilot,
  getRecommendationExplorer,
  getAdminObservability,
  getLogisticsRiskShipments,
  getDeliveryStopAssistance,
  resetUserProfile,
};
