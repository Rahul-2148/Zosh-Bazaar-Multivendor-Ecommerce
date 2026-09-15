import express from "express";
import aiController from "./ai.controller.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const aiRouter = express.Router();

// 1. Recommendation endpoints (compatible with /api/v1/recommendations)
aiRouter.get("/home", aiController.getHomeRecommendations);
aiRouter.get("/product/:productId", aiController.getProductRecommendations);
aiRouter.get("/cart", aiController.getCartRecommendations);

// 2. Behavioral events telemetry endpoint
aiRouter.post("/events", aiController.ingestEvents);

// 3. Grounded Conversational Shopping Assistant
aiRouter.post("/assistant/chat", aiController.chatAssistant);

// 4. Price Intelligence & Price Drop Alerts
aiRouter.get("/pricing/history/:productId", aiController.getPriceHistory);
aiRouter.post("/pricing/alerts", authMiddleware, aiController.createPriceAlert);
aiRouter.get("/pricing/alerts", authMiddleware, aiController.getUserPriceAlerts);
aiRouter.delete("/pricing/alerts/:alertId", authMiddleware, aiController.cancelPriceAlert);

// 5. Review Intelligence & Aspect Sentiment
aiRouter.get("/reviews/:productId", aiController.getReviewSummary);

// 6. Visual Search (Lens)
aiRouter.post("/vision/search", aiController.visualSearch);

// 7. Category Buying Guides
aiRouter.get("/guides/:categoryId", aiController.getBuyingGuide);

// 8. Seller AI Experiences
aiRouter.get("/seller/insights", aiController.getSellerInsights);
aiRouter.post("/seller/optimize-listing", aiController.optimizeListing);
aiRouter.get("/seller/pricing-simulation/:productId", aiController.simulatePricing);
aiRouter.get("/seller/inventory-forecast/:productId", aiController.forecastInventory);

// 9. Admin AI Copilot & Control Center
aiRouter.post("/admin/copilot", aiController.queryAdminCopilot);
aiRouter.get("/admin/recommendation-explorer", aiController.getRecommendationExplorer);
aiRouter.get("/admin/observability", aiController.getAdminObservability);

// 10. Logistics & Delivery AI
aiRouter.get("/logistics/risk-shipments", aiController.getLogisticsRiskShipments);
aiRouter.get("/delivery/stop-assistance", aiController.getDeliveryStopAssistance);

// 11. Customer Privacy & Personalization Controls
aiRouter.post("/privacy/reset", authMiddleware, aiController.resetUserProfile);

export default aiRouter;
