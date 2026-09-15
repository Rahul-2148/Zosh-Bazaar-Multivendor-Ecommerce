import { aiTracker } from "./aiEventTracker";

export interface RecommendationItem {
  productId: string;
  title: string;
  brand: string;
  categoryId?: string;
  categoryName?: string;
  sellingPrice: number;
  mrpPrice?: number;
  discountPercent?: number;
  images: string[];
  ratingAverage?: number;
  ratingCount?: number;
  inStock?: boolean;
  sellerName?: string;
  score?: number;
  explanationReason?: string;
  explanationText?: string;
  strategy?: string;
}

export interface RecommendationResponse {
  success: boolean;
  requestId: string;
  placement: string;
  modelVersion: string;
  strategy: string;
  totalReturned: number;
  recommendations: RecommendationItem[];
}

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const fetchRecommendations = async (
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<RecommendationResponse | null> => {
  try {
    const query = new URLSearchParams();
    query.set("sessionId", aiTracker.getSessionId());

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        query.set(k, String(v));
      }
    }

    const res = await fetch(`${apiBase}/api/v1/recommendations/${endpoint}?${query.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchHomeRecommendations = (limit = 6, placement = "home_for_you") => {
  return fetchRecommendations("home", { limit, placement });
};

export const fetchProductRecommendations = (productId: string, placement = "pdp_similar", limit = 6) => {
  return fetchRecommendations(`product/${productId}`, { placement, limit });
};

export const fetchCartRecommendations = (productIds: string[] = [], limit = 4) => {
  return fetchRecommendations("cart", { productIds: productIds.join(","), limit });
};
