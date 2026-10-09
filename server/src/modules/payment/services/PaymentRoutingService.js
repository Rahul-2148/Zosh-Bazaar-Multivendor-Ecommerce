import paymentProviderRegistry, { ProviderHealthStatus } from "./PaymentProviderRegistry.js";

/**
 * Payment Routing Service
 * Intelligently routes payment attempts to the most appropriate, healthy, and capable payment provider.
 * Enforces production fail-closed rules and guarantees immutable provider binding once an attempt is created.
 */
export class PaymentRoutingService {
  constructor(registry = paymentProviderRegistry) {
    this.registry = registry;
  }

  /**
   * Resolve best provider for a new payment attempt.
   * Considers rail, capabilities, health, priority, and production environment constraints.
   */
  resolveProviderForAttempt({
    rail = "UPI",
    preferredProvider = null,
    requiredCapability = null,
    requiredCapabilities = null,
    isProduction = undefined,
    environment = undefined,
  }) {
    const isProd =
      isProduction !== undefined
        ? isProduction
        : environment === "production" ||
          process.env.NODE_ENV === "production" ||
          process.env.PAYMENT_ENV === "production";

    const eligibleProviders = this.registry.getProvidersForRail(rail, {
      isProduction: isProd,
      requiredCapability,
      requiredCapabilities,
    });

    // 1. Fail-closed check: No eligible provider found
    if (!eligibleProviders || eligibleProviders.length === 0) {
      if (isProd) {
        const error = new Error(
          `Payment rail "${rail}" does not have any active, production-ready payment providers configured.`
        );
        error.code = "RAIL_NOT_PRODUCTION_READY";
        error.statusCode = 503;
        throw error;
      }

      throw new Error(`No payment provider currently available for rail "${rail}".`);
    }

    // 2. Preferred provider selection if compatible and not DOWN
    if (preferredProvider) {
      const preferred = eligibleProviders.find(
        (p) => p.providerId === preferredProvider.toUpperCase()
      );
      if (preferred && preferred.health.status !== ProviderHealthStatus.DOWN) {
        return preferred;
      }
    }

    // 3. Health-aware failover before attempt creation
    // If top provider is DOWN, fail over to the next healthy provider
    const healthyProviders = eligibleProviders.filter(
      (p) => p.health.status !== ProviderHealthStatus.DOWN
    );

    const selected = healthyProviders.length > 0 ? healthyProviders[0] : eligibleProviders[0];
    return selected;
  }

  /**
   * Resolve adapter instance for an EXISTING PaymentAttempt.
   * Invariant: Once an attempt is created, provider binding is IMMUTABLE.
   * Recovery and capture must continue with the bound provider.
   */
  getAdapterForAttempt(attempt) {
    if (!attempt) {
      throw new Error("Cannot resolve adapter: PaymentAttempt is required");
    }

    const providerId = attempt.provider || attempt.adapter;
    if (providerId) {
      const providerRecord = this.registry.getProvider(providerId);
      if (providerRecord && providerRecord.adapter) {
        return providerRecord.adapter;
      }
      throw new Error(`No adapter found for attempt ${attempt.attemptId} (provider: ${providerId})`);
    }

    // Fallback if legacy attempt has rail but no provider
    if (attempt.rail) {
      const fallback = this.registry.getProvidersForRail(attempt.rail)[0];
      if (fallback && fallback.adapter) {
        return fallback.adapter;
      }
    }

    throw new Error(`No adapter found for attempt ${attempt.attemptId} (provider: ${providerId})`);
  }

  /**
   * Alias for resolveProviderForAttempt
   */
  selectProvider(options = {}) {
    return this.resolveProviderForAttempt(options);
  }

  /**
   * Convenience method to resolve adapter directly by rail name.
   */
  resolveAdapter(rail, options = {}) {
    const provider = this.resolveProviderForAttempt({ rail, ...options });
    return provider.adapter;
  }
}

export const paymentRoutingService = new PaymentRoutingService();
export default paymentRoutingService;
