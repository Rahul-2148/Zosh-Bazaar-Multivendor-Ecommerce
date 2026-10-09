import razorpayAdapter from "../adapters/RazorpayAdapter.js";
import codRailAdapter from "../adapters/CodRailAdapter.js";
import sandboxAdapter from "../adapters/SandboxAdapter.js";
import upiRailAdapter from "../adapters/UpiRailAdapter.js";
import cardRailAdapter from "../adapters/CardRailAdapter.js";
import netBankingRailAdapter from "../adapters/NetBankingRailAdapter.js";
import cashfreeAdapter from "../adapters/CashfreeAdapter.js";
import payuAdapter from "../adapters/PayUAdapter.js";
import phonepeAdapter from "../adapters/PhonePeAdapter.js";

/**
 * Payment Provider Health Status Enum
 */
export const ProviderHealthStatus = Object.freeze({
  UP: "UP",
  RECOVERING: "RECOVERING",
  DEGRADED: "DEGRADED",
  DOWN: "DOWN",
  UNKNOWN: "UNKNOWN",
});

/**
 * Centralized Payment Provider Registry
 * Manages registered payment providers, adapters, capabilities, priorities, and runtime health metrics.
 */
export class PaymentProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.initDefaultProviders();
  }

  initDefaultProviders() {
    // 1. Authoritative Production Gateways (Multi-PSP)
    this.registerProvider({
      providerId: "RAZORPAY",
      name: "Razorpay Payment Gateway",
      railTypes: ["UPI", "CARD", "NETBANKING", "ALL"],
      adapter: razorpayAdapter,
      priority: 1,
      enabled: true,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    this.registerProvider({
      providerId: "CASHFREE",
      name: "Cashfree Payments (Multi-PSP)",
      railTypes: ["UPI", "CARD", "NETBANKING", "ALL"],
      adapter: cashfreeAdapter,
      priority: 2,
      enabled: true,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    this.registerProvider({
      providerId: "PAYU",
      name: "PayU Payments (Multi-PSP)",
      railTypes: ["UPI", "CARD", "NETBANKING", "ALL"],
      adapter: payuAdapter,
      priority: 3,
      enabled: true,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    this.registerProvider({
      providerId: "PHONEPE",
      name: "PhonePe Payment Gateway (Multi-PSP)",
      railTypes: ["UPI", "CARD", "NETBANKING", "ALL"],
      adapter: phonepeAdapter,
      priority: 4,
      enabled: true,
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    this.registerProvider({
      providerId: "COD",
      name: "Cash On Delivery (Direct)",
      railTypes: ["COD"],
      adapter: codRailAdapter,
      priority: 1,
      enabled: true,
      environment: "production",
    });

    // 2. Development / Sandbox Simulation Rails
    this.registerProvider({
      providerId: "SANDBOX_UPI",
      name: "Sandbox UPI Rail Simulator",
      railTypes: ["UPI"],
      adapter: upiRailAdapter,
      priority: 10,
      enabled: true,
      environment: "sandbox",
    });

    this.registerProvider({
      providerId: "SANDBOX_CARD",
      name: "Sandbox Card Rail Simulator",
      railTypes: ["CARD"],
      adapter: cardRailAdapter,
      priority: 10,
      enabled: true,
      environment: "sandbox",
    });

    this.registerProvider({
      providerId: "SANDBOX_NETBANKING",
      name: "Sandbox NetBanking Rail Simulator",
      railTypes: ["NETBANKING"],
      adapter: netBankingRailAdapter,
      priority: 10,
      enabled: true,
      environment: "sandbox",
    });

    this.registerProvider({
      providerId: "SANDBOX_SIMULATION",
      name: "Sandbox General Deterministic Adapter",
      railTypes: ["ALL", "SANDBOX"],
      adapter: sandboxAdapter,
      priority: 20,
      enabled: true,
      environment: "sandbox",
    });
  }

  /**
   * Register a payment rail provider.
   */
  registerProvider({
    providerId,
    name,
    railTypes = ["ALL"],
    adapter,
    priority = 10,
    enabled = true,
    environment = "sandbox",
  }) {
    if (!providerId || !adapter) {
      throw new Error("Cannot register provider: providerId and adapter are required");
    }

    const providerRecord = {
      providerId: providerId.toUpperCase(),
      name: name || providerId,
      railTypes: railTypes.map((r) => r.toUpperCase()),
      adapter,
      priority: Number(priority),
      enabled: Boolean(enabled),
      environment,
      capabilities: adapter.getCapabilities(),
      health: {
        status: ProviderHealthStatus.UP,
        lastCheckedAt: new Date(),
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        avgLatencyMs: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        latencySamples: [],
        successRate: 1.0,
        failureRate: 0.0,
      },
    };

    this.providers.set(providerRecord.providerId, providerRecord);
    return providerRecord;
  }


  /**
   * Get provider by ID.
   */
  getProvider(providerId) {
    if (!providerId) return null;
    return this.providers.get(providerId.toUpperCase()) || null;
  }

  /**
   * Retrieve all eligible providers for a specific rail.
   * Filters by enabled, environment (production vs sandbox), health, and capabilities.
   */
  getProvidersForRail(rail, options = {}) {
    const key = (rail || "ALL").toUpperCase();
    const isProduction =
      options.isProduction !== undefined
        ? options.isProduction
        : process.env.NODE_ENV === "production" || process.env.PAYMENT_ENV === "production";
    const requiredCapability = options.requiredCapability;

    const matched = [];

    for (const provider of this.providers.values()) {
      if (!provider.enabled) continue;

      // 1. Rail Type match
      let railMatches;
      if (key.startsWith("SANDBOX")) {
        railMatches = provider.railTypes.includes(key) || provider.providerId === key;
      } else {
        railMatches =
          provider.railTypes.includes(key) ||
          provider.railTypes.includes("ALL") ||
          key === "ALL";
      }
      if (!railMatches) continue;

      // 2. Production Safety Filter: In production, reject any non-production-ready provider
      if (isProduction && !provider.adapter.isProductionReady()) {
        continue;
      }

      // 3. Capability requirement check
      const reqCaps = options.requiredCapabilities || options.requiredCapability;
      if (reqCaps) {
        const capsList = Array.isArray(reqCaps) ? reqCaps : [reqCaps];
        const allPresent = capsList.every((cap) => provider.adapter.hasCapability(cap));
        if (!allPresent) continue;
      }

      matched.push(provider);
    }

    // Sort by Priority (lowest number = highest priority)
    matched.sort((a, b) => {
      // Prioritize UP > RECOVERING > DEGRADED > UNKNOWN > DOWN
      const healthWeight = { UP: 0, RECOVERING: 1, DEGRADED: 2, UNKNOWN: 3, DOWN: 4 };
      const healthA = healthWeight[a.health.status] ?? 3;
      const healthB = healthWeight[b.health.status] ?? 3;

      if (healthA !== healthB) {
        return healthA - healthB;
      }
      return a.priority - b.priority;
    });

    return matched;
  }

  /**
   * Record outcome of a payment attempt to maintain real-time health metrics.
   * Implements strict circuit breaker state machine:
   * UP -> DEGRADED -> DOWN -> RECOVERING -> UP
   */
  recordAttemptOutcome(providerId, { success = true, latencyMs = 100, isTimeout = false, error = null }) {
    const provider = this.getProvider(providerId);
    if (!provider) return;

    const h = provider.health;
    h.totalAttempts++;
    h.lastCheckedAt = new Date();

    const lat = Math.max(1, Number(latencyMs || 0));
    if (!Array.isArray(h.latencySamples)) h.latencySamples = [];
    h.latencySamples.push(lat);
    if (h.latencySamples.length > 20) h.latencySamples.shift();

    // Compute percentiles (p50, p95, p99)
    const sorted = [...h.latencySamples].sort((a, b) => a - b);
    h.p50 = sorted[Math.floor(sorted.length * 0.5)] || lat;
    h.p95 = sorted[Math.floor(sorted.length * 0.95)] || lat;
    h.p99 = sorted[Math.floor(sorted.length * 0.99)] || lat;

    if (success) {
      h.successCount++;
      h.consecutiveSuccesses = (h.consecutiveSuccesses || 0) + 1;
      h.consecutiveFailures = 0;
    } else if (isTimeout) {
      h.timeoutCount++;
      h.consecutiveFailures = (h.consecutiveFailures || 0) + 1;
      h.consecutiveSuccesses = 0;
    } else {
      h.failureCount++;
      h.consecutiveFailures = (h.consecutiveFailures || 0) + 1;
      h.consecutiveSuccesses = 0;
    }

    // Rolling latency average
    h.avgLatencyMs = Math.round(
      (h.avgLatencyMs * (h.totalAttempts - 1) + lat) / h.totalAttempts
    );

    // Compute success rate & failure rate
    h.successRate = h.totalAttempts > 0 ? Number((h.successCount / h.totalAttempts).toFixed(4)) : 1.0;
    h.failureRate = Number((1 - h.successRate).toFixed(4));

    // Circuit Breaker Transitions
    if (h.consecutiveFailures >= 3 || h.timeoutCount >= 3) {
      h.status = ProviderHealthStatus.DOWN;
    } else if (h.consecutiveFailures >= 2) {
      h.status = ProviderHealthStatus.DEGRADED;
    } else if (h.status === ProviderHealthStatus.DOWN && success) {
      h.status = ProviderHealthStatus.RECOVERING;
    } else if (h.status === ProviderHealthStatus.RECOVERING && h.consecutiveSuccesses >= 2) {
      h.status = ProviderHealthStatus.UP;
    } else if (h.status === ProviderHealthStatus.DEGRADED && h.successRate >= 0.85) {
      h.status = ProviderHealthStatus.UP;
    }
  }

  /**
   * Convenience helper to record health outcome.
   */
  recordHealth(providerId, success = true, latencyMs = 100) {
    return this.recordAttemptOutcome(providerId, { success, latencyMs });
  }

  /**
   * Retrieve health state of a provider.
   */
  getProviderHealth(providerId) {
    const provider = this.getProvider(providerId);
    return provider ? provider.health : null;
  }

  /**
   * Update provider operational configuration (Admin Control Plane).
   */
  updateProvider(providerId, updates = {}) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" not found in registry`);
    }

    if (updates.enabled !== undefined) {
      provider.enabled = Boolean(updates.enabled);
    }
    if (updates.priority !== undefined) {
      provider.priority = Number(updates.priority);
    }
    if (updates.healthStatus !== undefined) {
      if (Object.values(ProviderHealthStatus).includes(updates.healthStatus)) {
        provider.health.status = updates.healthStatus;
      }
    }

    return provider;
  }

  /**
   * List all providers with health summaries for monitoring and admin console.
   */
  getAllProviders() {
    return Array.from(this.providers.values()).map((p) => ({
      providerId: p.providerId,
      name: p.name,
      railTypes: p.railTypes,
      priority: p.priority,
      enabled: p.enabled,
      environment: p.environment,
      productionReady: p.adapter.isProductionReady(),
      capabilities: p.capabilities,
      health: p.health,
    }));
  }
}

export const paymentProviderRegistry = new PaymentProviderRegistry();
export default paymentProviderRegistry;
