import { Api } from "../config/Api";
import { aiTracker } from "./aiEventTracker";

export interface ExecutionStep {
  step: string;
  detail: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface ComparisonRow {
  attributeName: string;
  valuesByProduct: Record<string, string>;
  winnerProductId?: string;
  highlightDifference?: boolean;
}

export interface StructuredComparison {
  category: string;
  productIds: string[];
  productTitles: Record<string, string>;
  productImages: Record<string, string>;
  productPrices: Record<string, number>;
  attributes: ComparisonRow[];
  verdictSummary?: string;
}

export interface ActionPayload {
  actionType: "ADD_TO_CART" | "SET_PRICE_ALERT" | "VIEW_PRODUCT" | "COMPARE_PRODUCTS";
  productId?: string;
  productTitle?: string;
  targetPrice?: number;
  quantity?: number;
  confirmationRequired?: boolean;
  status?: "PROPOSED" | "CONFIRMED" | "EXECUTED";
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  suggestedProducts: any[];
  suggestedActions: string[];
  isGrounded: boolean;
  confidence: number;
  executionSteps?: ExecutionStep[];
  structuredComparison?: StructuredComparison;
  actionPayloads?: ActionPayload[];
  persistedContext?: Record<string, any>;
}

export interface PricePoint {
  date: string;
  timestamp: string;
  price: number;
  mrp: number;
}

export interface PriceHistoryResponse {
  success: boolean;
  productId: string;
  title: string;
  currentPrice: number;
  mrpPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceDropPercent: number;
  trend: "FALLING" | "RISING" | "STABLE";
  points: PricePoint[];
  currency: string;
  daysAnalyzed: number;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: "POSITIVE" | "MIXED" | "NEGATIVE";
  score: number;
  mentionsCount: number;
  summary: string;
}

export interface ReviewSummaryResponse {
  success: boolean;
  productId: string;
  overallScore: number;
  verifiedReviewsCount: number;
  sentimentBreakdown: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
  };
  aspectSentiment: AspectSentiment[];
  topPros: string[];
  topCons: string[];
  verdict: string;
  confidenceScore: number;
}

export interface VisualSearchResult {
  success: boolean;
  queryType: string;
  visualFeaturesExtracted: {
    detectedCategory?: string;
    dominantColor?: string;
    perceptualConfidence?: number;
  };
  totalFound: number;
  matches: any[];
  tookMs: number;
}

export interface BuyingGuideResponse {
  success: boolean;
  categoryId: string;
  title: string;
  subtitle: string;
  overview: string;
  keyFactorsToConsider: Array<{
    factor: string;
    description: string;
    priority: "HIGH" | "MEDIUM" | "OPTIONAL";
  }>;
  recommendedFor: string[];
  avoidIf: string[];
}

export const aiCommerceService = {
  // 1. Conversational Shopping Assistant 2.0
  async chatAssistant(
    messages: Array<{ role: string; content: string }>,
    persistedContext: Record<string, any> = {}
  ): Promise<AssistantChatResponse> {
    const sessionId = aiTracker.getSessionId();
    const res = await Api.post("/ai/assistant/chat", {
      messages,
      sessionId,
      persistedContext,
    });
    return res.data;
  },

  // 2. Price Intelligence
  async getPriceHistory(productId: string, days = 90): Promise<PriceHistoryResponse> {
    const res = await Api.get(`/ai/pricing/history/${productId}?days=${days}`);
    return res.data;
  },

  async createPriceAlert(payload: {
    productId: string;
    targetPrice: number;
    channels?: string[];
    autoBuyPolicy?: {
      enabled: boolean;
      maxAuthorizedPrice: number;
      deliveryAddress?: string;
      quantityLimit?: number;
      paymentMethodType?: string;
    } | null;
  }) {
    const res = await Api.post("/ai/pricing/alerts", payload);
    return res.data;
  },

  async getUserPriceAlerts() {
    const res = await Api.get("/ai/pricing/alerts");
    return res.data;
  },

  async cancelPriceAlert(alertId: string) {
    const res = await Api.delete(`/ai/pricing/alerts/${alertId}`);
    return res.data;
  },

  // 3. Review Intelligence
  async getReviewSummary(productId: string): Promise<ReviewSummaryResponse> {
    const res = await Api.get(`/ai/reviews/${productId}`);
    return res.data;
  },

  // 4. Visual Search (Lens)
  async visualSearch(imageBase64: string, categoryHint?: string): Promise<VisualSearchResult> {
    const res = await Api.post("/ai/vision/search", {
      imageBase64,
      categoryHint,
      limit: 8,
    });
    return res.data;
  },

  // 5. Category Buying Guides
  async getBuyingGuide(categoryId: string): Promise<BuyingGuideResponse> {
    const res = await Api.get(`/ai/guides/${categoryId}`);
    return res.data;
  },

  // 6. Privacy & Personalization Reset
  async resetPersonalization() {
    const res = await Api.post("/ai/privacy/reset");
    return res.data;
  },
};

export default aiCommerceService;
