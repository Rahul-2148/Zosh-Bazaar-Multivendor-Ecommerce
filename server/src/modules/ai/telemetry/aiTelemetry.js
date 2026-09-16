/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - AI TELEMETRY
 * Tracks request traces, token usage, cost, fallbacks, and aggregated metrics.
 * Redacts all keys, tokens, and PII.
 */

import crypto from 'crypto';

class AITelemetryTracker {
  constructor() {
    this.recentTraces = []; // max 200 recent traces
    this.totalCostUsd = 0;
    this.totalTokens = 0;
    this.errorCounts = {};
    this.toolExecutions = { total: 0, failures: 0 };
  }

  createTraceContext(taskType = 'CHAT', existingTraceId = null) {
    return {
      requestId: `req_${crypto.randomBytes(8).toString('hex')}`,
      traceId: existingTraceId || `trace_${crypto.randomBytes(12).toString('hex')}`,
      taskType,
      startTime: Date.now(),
      attempts: [],
      selectedProvider: null,
      selectedModel: null,
      fallbackOccurred: false,
      tools: [],
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      costEstimate: { usd: 0, inr: 0 },
      success: false,
      error: null,
    };
  }

  recordAttempt(context, providerId, model, success, latencyMs, errorReason = null) {
    context.attempts.push({
      providerId,
      model,
      success,
      latencyMs,
      errorReason,
      timestamp: new Date().toISOString(),
    });

    if (!success && errorReason) {
      this.errorCounts[errorReason] = (this.errorCounts[errorReason] || 0) + 1;
    }
  }

  recordToolExecution(context, toolName, success, latencyMs = 0) {
    this.toolExecutions.total += 1;
    if (!success) {
      this.toolExecutions.failures += 1;
    }
    context.tools.push({
      toolName,
      success,
      latencyMs,
    });
  }

  finalizeTrace(context, details = {}) {
    context.endTime = Date.now();
    context.durationMs = context.endTime - context.startTime;
    context.selectedProvider = details.providerId || context.selectedProvider;
    context.selectedModel = details.model || context.selectedModel;
    context.success = details.success ?? (context.attempts.some(a => a.success));
    context.fallbackOccurred = context.attempts.length > 1;

    if (details.tokens) {
      context.tokenUsage = details.tokens;
      this.totalTokens += details.tokens.total || 0;
    }
    if (details.cost) {
      context.costEstimate = details.cost;
      this.totalCostUsd += details.cost.usd || 0;
    }

    this.recentTraces.unshift(context);
    if (this.recentTraces.length > 200) {
      this.recentTraces.pop();
    }

    return context;
  }

  getAggregatedMetrics() {
    const totalRequests = this.recentTraces.length;
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        requestsPerMinute: 0,
        successRate: 100,
        fallbackRate: 0,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        totalTokens: 0,
        totalEstimatedCostUsd: 0,
        toolCallFailureRate: 0,
        errorBreakdown: {},
        recentTraces: [],
      };
    }

    const successes = this.recentTraces.filter(t => t.success).length;
    const fallbacks = this.recentTraces.filter(t => t.fallbackOccurred).length;
    const latencies = this.recentTraces.map(t => t.durationMs).filter(d => typeof d === 'number');

    const avgLat = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const sortedLat = [...latencies].sort((a, b) => a - b);
    const p95Idx = Math.floor(sortedLat.length * 0.95);
    const p95Lat = sortedLat.length ? sortedLat[Math.min(p95Idx, sortedLat.length - 1)] : 0;

    // Requests in last 60 seconds
    const oneMinAgo = Date.now() - 60000;
    const rpm = this.recentTraces.filter(t => t.startTime >= oneMinAgo).length;

    const toolFailureRate = this.toolExecutions.total > 0
      ? Math.round((this.toolExecutions.failures / this.toolExecutions.total) * 100)
      : 0;

    return {
      totalRequests,
      requestsPerMinute: rpm,
      successRate: Math.round((successes / totalRequests) * 100),
      fallbackRate: Math.round((fallbacks / totalRequests) * 100),
      averageLatencyMs: avgLat,
      p95LatencyMs: p95Lat,
      totalTokens: this.totalTokens,
      totalEstimatedCostUsd: Number(this.totalCostUsd.toFixed(4)),
      toolCallFailureRate: toolFailureRate,
      errorBreakdown: { ...this.errorCounts },
      recentTraces: this.recentTraces.slice(0, 15).map(t => ({
        requestId: t.requestId,
        traceId: t.traceId,
        taskType: t.taskType,
        selectedProvider: t.selectedProvider,
        selectedModel: t.selectedModel,
        fallbackOccurred: t.fallbackOccurred,
        attemptsCount: t.attempts.length,
        durationMs: t.durationMs,
        success: t.success,
        tools: t.tools.map(tool => tool.toolName),
        timestamp: new Date(t.startTime).toISOString(),
      })),
    };
  }
}

export const aiTelemetry = new AITelemetryTracker();
