/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - CAPABILITY-AWARE ROUTER ENGINE
 * Selects and orders candidate providers based on capabilities, health,
 * latency profile, circuit breaker status, and fallback policies.
 */

import { ProviderId } from '../schemas/providerCapabilities.js';
import { circuitBreaker, CircuitState } from '../policies/circuitBreaker.js';
import { healthMonitor } from '../health/healthMonitor.js';

export class CapabilityRouterEngine {
  constructor(providersMap = new Map()) {
    this.providers = providersMap;
  }

  registerProvider(provider) {
    this.providers.set(provider.providerId, provider);
  }

  getProvider(providerId) {
    return this.providers.get(providerId);
  }

  /**
   * Determine the optimal fallback sequence for a given task and capability requirement.
   */
  resolveExecutionChain(requiredCapabilities = [], _options = {}) {
    const preferredProvider = process.env.AI_PREFERRED_PROVIDER || ProviderId.GEMINI;
    const defaultPriority = [
      preferredProvider,
      ProviderId.GEMINI,
      ProviderId.GROQ,
      ProviderId.DEEPSEEK,
      ProviderId.OPENAI,
      ProviderId.ZOSH_NATIVE,
    ];

    // Deduplicate preference list
    const priorityOrder = Array.from(new Set(defaultPriority));

    const eligible = [];

    for (const providerId of priorityOrder) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      // 1. Check if provider is configured
      if (!provider.isConfigured()) {
        continue;
      }

      // 2. Check capability matching
      const caps = provider.getCapabilities();
      const hasAllCapabilities = requiredCapabilities.every((cap) => caps.includes(cap));
      if (!hasAllCapabilities) {
        continue;
      }

      // 3. Check circuit breaker state
      const cbStatus = circuitBreaker.getStatus(providerId);
      const isCircuitOpen = cbStatus.state === CircuitState.OPEN;

      const health = healthMonitor.getProviderHealth(providerId);

      eligible.push({
        providerId,
        provider,
        circuitOpen: isCircuitOpen,
        circuitState: cbStatus.state,
        status: health.status,
        avgLatencyMs: health.averageLatencyMs,
        priorityIndex: priorityOrder.indexOf(providerId),
      });
    }

    // Sort eligible candidates:
    // 1. Closed/Half-Open circuits first (avoid OPEN)
    // 2. Priority sequence: Preferred -> Gemini -> Groq -> DeepSeek -> OpenAI -> Zosh Native
    eligible.sort((a, b) => {
      if (a.circuitOpen !== b.circuitOpen) {
        return a.circuitOpen ? 1 : -1;
      }
      return a.priorityIndex - b.priorityIndex;
    });

    const chain = eligible.map(e => e.provider);

    // Guaranteed safety: If Zosh Native is not yet in chain, append it
    const native = this.providers.get(ProviderId.ZOSH_NATIVE);
    if (native && !chain.some(p => p.providerId === ProviderId.ZOSH_NATIVE)) {
      chain.push(native);
    }

    return chain;
  }
}
