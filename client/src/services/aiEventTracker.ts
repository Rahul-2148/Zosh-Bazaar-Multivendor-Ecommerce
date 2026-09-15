/**
 * Zosh Bazaar Client AI Behavioral Telemetry SDK
 * Lightweight, debounced, offline-resilient event tracker for ML feedback loops.
 */

export interface RecommendationContext {
  recommendationId?: string;
  requestId?: string;
  placement?: string;
  modelVersion?: string;
  rankPosition?: number;
}

export interface TelemetryEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  sessionId: string;
  anonymousId: string;
  userId?: string;
  productId?: string;
  categoryId?: string;
  sellerId?: string;
  brand?: string;
  price?: number;
  quantity?: number;
  searchQuery?: string;
  recommendationContext?: RecommendationContext;
  device?: {
    deviceType: string;
    screenResolution: string;
  };
  metadata?: Record<string, any>;
}

class AIEventTracker {
  private queue: TelemetryEvent[] = [];
  private flushTimer: any = null;
  private readonly FLUSH_INTERVAL_MS = 2500;
  private readonly MAX_BATCH_SIZE = 10;
  private readonly apiBase: string;

  constructor() {
    this.apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    this.initSession();
    this.flushStoredEvents();

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush(true));
    }
  }

  private initSession(): void {
    if (typeof window === "undefined") return;

    // Ephemeral session ID
    if (!sessionStorage.getItem("zb_ai_session_id")) {
      const sessId = "sess_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem("zb_ai_session_id", sessId);
    }

    // Persistent anonymous ID
    if (!localStorage.getItem("zb_ai_anon_id")) {
      const anonId = "anon_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("zb_ai_anon_id", anonId);
    }
  }

  public getSessionId(): string {
    return (typeof window !== "undefined" && sessionStorage.getItem("zb_ai_session_id")) || "anon_session";
  }

  public getAnonymousId(): string {
    return (typeof window !== "undefined" && localStorage.getItem("zb_ai_anon_id")) || "anon_user";
  }

  public track(eventType: string, payload: Partial<TelemetryEvent> = {}): void {
    const event: TelemetryEvent = {
      eventId: "ev_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      anonymousId: this.getAnonymousId(),
      device: {
        deviceType: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
        screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "1920x1080",
      },
      ...payload,
    };

    this.queue.push(event);

    if (this.queue.length >= this.MAX_BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }
  }

  public flush(isBeacon = false): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    const endpoint = `${this.apiBase}/api/v1/ai/events`;
    const payload = JSON.stringify({ events: batch });

    if (isBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(() => {
      // Offline fallback: save to localStorage to retry on next load
      try {
        const stored = JSON.parse(localStorage.getItem("zb_ai_offline_queue") || "[]");
        localStorage.setItem("zb_ai_offline_queue", JSON.stringify(stored.concat(batch).slice(-100)));
      } catch {
        // storage quota exceeded, drop silently
      }
    });
  }

  private flushStoredEvents(): void {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("zb_ai_offline_queue") || "[]");
      if (stored.length > 0) {
        localStorage.removeItem("zb_ai_offline_queue");
        fetch(`${this.apiBase}/api/v1/ai/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: stored }),
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // ── High-Level Action Helpers ─────────────────────────────
  public trackProductView(productId: string, categoryId?: string, brand?: string, price?: number): void {
    this.track("product_view", { productId, categoryId, brand, price });
  }

  public trackAddToCart(productId: string, categoryId?: string, price?: number, quantity = 1): void {
    this.track("add_to_cart", { productId, categoryId, price, quantity });
  }

  public trackSearch(searchQuery: string): void {
    this.track("search_submitted", { searchQuery });
  }

  public trackRecommendationImpression(context: RecommendationContext, productId: string): void {
    this.track("recommendation_impression", { recommendationContext: context, productId });
  }

  public trackRecommendationClick(context: RecommendationContext, productId: string): void {
    this.track("recommendation_clicked", { recommendationContext: context, productId });
  }
}

export const aiTracker = new AIEventTracker();
export default aiTracker;
