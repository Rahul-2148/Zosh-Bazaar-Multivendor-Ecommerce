/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - HEALTH MONITOR
 * Tracks live provider health, rolling latency, success rates, and configuration status.
 * NEVER exposes raw credentials.
 */

import { ProviderId, PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';
import { circuitBreaker } from '../policies/circuitBreaker.js';

export const ProviderStatus = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  DOWN: 'DOWN',
  UNCONFIGURED: 'UNCONFIGURED',
};

class ProviderHealthMonitor {
  constructor() {
    this.providerStats = new Map();
    this._initProviders();
  }

  _initProviders() {
    for (const providerId of Object.values(ProviderId)) {
      this.providerStats.set(providerId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        latencies: [],
        lastCheckTime: null,
        lastError: null,
      });
    }
  }

  isConfigured(providerId) {
    if (providerId === ProviderId.ZOSH_NATIVE) return true;
    if (providerId === ProviderId.GEMINI) return Boolean(process.env.GEMINI_API_KEY);
    if (providerId === ProviderId.GROQ) return Boolean(process.env.GROQ_API_KEY);
    if (providerId === ProviderId.DEEPSEEK) return Boolean(process.env.DEEPSEEK_API_KEY);
    if (providerId === ProviderId.OPENAI) return Boolean(process.env.OPENAI_API_KEY);
    return false;
  }

  recordExecution(providerId, success, latencyMs, errorReason = null) {
    const stats = this.providerStats.get(providerId);
    if (!stats) return;

    stats.totalRequests += 1;
    if (success) {
      stats.successfulRequests += 1;
      circuitBreaker.recordSuccess(providerId);
    } else {
      stats.failedRequests += 1;
      stats.lastError = errorReason;
      circuitBreaker.recordFailure(providerId, errorReason);
    }

    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      stats.latencies.push(latencyMs);
      if (stats.latencies.length > 50) {
        stats.latencies.shift(); // Keep rolling window of 50
      }
    }
    stats.lastCheckTime = new Date().toISOString();
  }

  getProviderHealth(providerId) {
    const configured = this.isConfigured(providerId);
    const cbStatus = circuitBreaker.getStatus(providerId);
    const stats = this.providerStats.get(providerId) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      latencies: [],
      lastCheckTime: null,
      lastError: null,
    };

    if (!configured) {
      return {
        providerId,
        name: PROVIDER_SPECIFICATIONS[providerId]?.displayName || providerId,
        configured: false,
        status: ProviderStatus.UNCONFIGURED,
        circuitBreaker: cbStatus.state,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        successRate: 0,
        totalRequests: 0,
        lastCheckTime: stats.lastCheckTime,
      };
    }

    if (cbStatus.state === 'OPEN') {
      return {
        providerId,
        name: PROVIDER_SPECIFICATIONS[providerId]?.displayName || providerId,
        configured: true,
        status: ProviderStatus.DOWN,
        circuitBreaker: cbStatus.state,
        lastError: cbStatus.lastErrorReason,
        averageLatencyMs: this._calcAvg(stats.latencies),
        p95LatencyMs: this._calcP95(stats.latencies),
        successRate: this._calcSuccessRate(stats),
        totalRequests: stats.totalRequests,
        lastCheckTime: stats.lastCheckTime,
      };
    }

    const successRate = this._calcSuccessRate(stats);
    let status = ProviderStatus.HEALTHY;
    if (cbStatus.state === 'HALF_OPEN' || (stats.totalRequests >= 5 && successRate < 80)) {
      status = ProviderStatus.DEGRADED;
    }

    return {
      providerId,
      name: PROVIDER_SPECIFICATIONS[providerId]?.displayName || providerId,
      configured: true,
      status,
      circuitBreaker: cbStatus.state,
      averageLatencyMs: this._calcAvg(stats.latencies),
      p95LatencyMs: this._calcP95(stats.latencies),
      successRate,
      totalRequests: stats.totalRequests,
      lastCheckTime: stats.lastCheckTime,
    };
  }

  getAllHealth() {
    const result = {};
    for (const providerId of Object.values(ProviderId)) {
      result[providerId] = this.getProviderHealth(providerId);
    }
    return result;
  }

  _calcAvg(latencies) {
    if (!latencies.length) return 0;
    const sum = latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / latencies.length);
  }

  _calcP95(latencies) {
    if (!latencies.length) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  _calcSuccessRate(stats) {
    if (!stats.totalRequests) return 100;
    return Math.round((stats.successfulRequests / stats.totalRequests) * 100);
  }
}

export const healthMonitor = new ProviderHealthMonitor();
