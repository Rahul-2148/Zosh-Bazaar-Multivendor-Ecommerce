/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - CENTRALIZED AI GATEWAY
 * Orchestrates multi-provider mesh, capability routing, smart fallback,
 * circuit breaking, authoritative tool execution, streaming, and telemetry.
 */

import { AICapability } from '../schemas/capabilities.js';
import { AIStreamEventType, AIErrorReason } from '../schemas/normalizedTypes.js';
import { ProviderId } from '../schemas/providerCapabilities.js';
import { CapabilityRouterEngine } from '../routing/router.engine.js';
import { GeminiProvider } from '../providers/gemini.provider.js';
import { GroqProvider } from '../providers/groq.provider.js';
import { DeepSeekProvider } from '../providers/deepseek.provider.js';
import { OpenAIProvider } from '../providers/openai.provider.js';
import { ZoshNativeProvider } from '../providers/zoshNative.provider.js';
import { toolExecutor } from '../tools/toolExecutor.js';
import { healthMonitor } from '../health/healthMonitor.js';
import { aiTelemetry } from '../telemetry/aiTelemetry.js';
import { estimateTokenCost } from '../policies/costPolicy.js';
import { withRetry } from '../policies/retryPolicy.js';

export const ZOSH_ASSISTANT_SYSTEM_PROMPT = `You are Zosh Assistant, the intelligent personal shopping partner for Zosh Bazaar, India's premier multi-vendor online marketplace.

Core Personality & Rules:
1. Tone: Warm, polite, helpful, concise, and structured. You understand English and Hinglish seamlessly.
2. GREETINGS: If the user says "hi", "hello", "hey", or a casual greeting, greet warmly and summarize 4 things you can do (Search Deals, Compare Specs, Track Orders, Returns/Policies) with 4 quick prompt suggestions. DO NOT hallucinate or dump random products unprompted.
3. PRODUCT SEARCH: Present top verified products clearly with Title, Brand, Price in Indian Rupees (₹), Discount %, Ratings, and bullet points highlighting key features.
4. COMPARISONS: When asked to compare products (e.g. "X vs Y" or "which is better"), provide a side-by-side spec breakdown and a clear buying verdict.
5. ORDER TRACKING: Guide users on checking live delivery milestones, estimated arrival dates, and courier details.
6. POLICIES: 7-day hassle-free return window, free doorstep pickup within 24-48 hours, refunds in 2-4 business days, free shipping above ₹499, and COD available up to ₹10,000.
7. Always format clean markdown headers, bold prices, and bullet points. Never display internal errors or raw database IDs.`;

export class AIGateway {
  constructor() {
    this.router = new CapabilityRouterEngine();
    this._initProviders();
  }

  _initProviders() {
    this.gemini = new GeminiProvider();
    this.groq = new GroqProvider();
    this.deepseek = new DeepSeekProvider();
    this.openai = new OpenAIProvider();
    this.native = new ZoshNativeProvider();

    this.router.registerProvider(this.gemini);
    this.router.registerProvider(this.groq);
    this.router.registerProvider(this.deepseek);
    this.router.registerProvider(this.openai);
    this.router.registerProvider(this.native);
  }

  /**
   * Non-streaming conversational entrypoint with capability routing & fallback.
   */
  async chat(request = {}) {
    const enrichedRequest = {
      includeTools: true,
      ...request,
      systemInstruction: request.systemInstruction || ZOSH_ASSISTANT_SYSTEM_PROMPT,
    };

    const requiredCaps = [AICapability.CHAT];
    if (enrichedRequest.includeTools) {
      requiredCaps.push(AICapability.TOOL_CALLING);
    }

    const chain = this.router.resolveExecutionChain(requiredCaps);
    const traceCtx = aiTelemetry.createTraceContext('CHAT', enrichedRequest.traceId);

    let lastError = null;

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      const start = Date.now();

      try {
        const response = await withRetry(
          async () => provider.generate(enrichedRequest),
          { maxRetries: 1, baseMs: 250 }
        );

        const latency = Date.now() - start;
        healthMonitor.recordExecution(provider.providerId, true, latency);
        aiTelemetry.recordAttempt(traceCtx, provider.providerId, response.model, true, latency);

        // Calculate token cost
        const tokens = response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        const cost = estimateTokenCost(provider.providerId, tokens.promptTokens, tokens.completionTokens);

        // Execute any authoritative tools requested by LLM
        let toolResults = [];
        if (response.toolCalls && response.toolCalls.length > 0) {
          toolResults = await this._executeTools(response.toolCalls, request, traceCtx);
        }

        aiTelemetry.finalizeTrace(traceCtx, {
          providerId: provider.providerId,
          model: response.model,
          success: true,
          tokens: {
            prompt: tokens.promptTokens,
            completion: tokens.completionTokens,
            total: tokens.totalTokens,
          },
          cost: { usd: cost.totalCostUsd, inr: cost.totalCostInr },
        });

        return {
          ...response,
          requestId: traceCtx.requestId,
          traceId: traceCtx.traceId,
          fallbackOccurred: i > 0,
          attemptedProviders: traceCtx.attempts.map((a) => a.providerId),
          toolResults,
        };
      } catch (err) {
        const latency = Date.now() - start;
        const reason = err.reason || AIErrorReason.UNKNOWN_ERROR;
        healthMonitor.recordExecution(provider.providerId, false, latency, reason);
        aiTelemetry.recordAttempt(traceCtx, provider.providerId, provider.spec?.defaultModel, false, latency, reason);
        lastError = err;
        // Continue to next provider in fallback chain
      }
    }

    // If all providers failed, fallback to native deterministic generation
    const nativeRes = await this.native.generate(enrichedRequest);
    aiTelemetry.finalizeTrace(traceCtx, {
      providerId: ProviderId.ZOSH_NATIVE,
      model: this.native.spec.defaultModel,
      success: true,
    });

    return {
      ...nativeRes,
      requestId: traceCtx.requestId,
      traceId: traceCtx.traceId,
      fallbackOccurred: true,
      lastError: lastError?.message,
    };
  }

  /**
   * Authoritative Tool Execution Handler
   */
  async _executeTools(toolCalls, request, traceCtx) {
    const results = [];
    for (const tc of toolCalls) {
      const toolStart = Date.now();
      const res = await toolExecutor.execute(tc.name, tc.args, {
        userId: request.userId,
        role: request.userRole || 'CUSTOMER',
      });

      const toolDuration = Date.now() - toolStart;
      aiTelemetry.recordToolExecution(traceCtx, tc.name, res.success, toolDuration);

      results.push({
        id: tc.id,
        name: tc.name,
        result: res,
      });
    }
    return results;
  }

  /**
   * Real Streaming SSE entry point with failover before/during stream.
   */
  async streamChat(request = {}, onEvent) {
    const enrichedRequest = {
      includeTools: true,
      ...request,
      systemInstruction: request.systemInstruction || ZOSH_ASSISTANT_SYSTEM_PROMPT,
    };

    const requiredCaps = [AICapability.CHAT, AICapability.STREAMING];
    const chain = this.router.resolveExecutionChain(requiredCaps);
    const traceCtx = aiTelemetry.createTraceContext('STREAM_CHAT', enrichedRequest.traceId);

    onEvent({
      type: AIStreamEventType.START,
      requestId: traceCtx.requestId,
      traceId: traceCtx.traceId,
      timestamp: new Date().toISOString(),
    });

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      const start = Date.now();
      let streamStarted = false;

      try {
        if (i > 0) {
          onEvent({
            type: AIStreamEventType.STEP,
            step: {
              stepName: 'Engaging secondary AI engine',
              status: 'IN_PROGRESS',
              detail: `Connecting to ${provider.spec?.displayName || provider.providerId}...`,
            },
          });
        }

        const streamResult = await provider.stream(enrichedRequest, (chunk) => {
          streamStarted = true;
          onEvent(chunk);
        });

        const latency = Date.now() - start;
        healthMonitor.recordExecution(provider.providerId, true, latency);
        aiTelemetry.recordAttempt(traceCtx, provider.providerId, streamResult.model, true, latency);

        // Execute any authoritative tools returned
        if (streamResult.toolCalls && streamResult.toolCalls.length > 0) {
          const toolResults = await this._executeTools(streamResult.toolCalls, enrichedRequest, traceCtx);
          for (const tr of toolResults) {
            onEvent({
              type: AIStreamEventType.TOOL_RESULT,
              tool: tr.name,
              data: tr.result?.data,
              success: tr.result?.success,
            });
          }
        }

        aiTelemetry.finalizeTrace(traceCtx, {
          providerId: provider.providerId,
          model: streamResult.model,
          success: true,
        });

        onEvent({
          type: AIStreamEventType.DONE,
          providerId: provider.providerId,
          durationMs: Date.now() - start,
        });

        return;
      } catch (err) {
        const latency = Date.now() - start;
        const reason = err.reason || AIErrorReason.UNKNOWN_ERROR;
        healthMonitor.recordExecution(provider.providerId, false, latency, reason);
        aiTelemetry.recordAttempt(traceCtx, provider.providerId, provider.spec?.defaultModel, false, latency, reason);

        // If streaming tokens were already emitted to client, we cannot cleanly restart token stream
        if (streamStarted) {
          onEvent({
            type: AIStreamEventType.ERROR,
            message: 'Stream interrupted. Finalizing catalog context.',
            retryable: false,
          });
          onEvent({ type: AIStreamEventType.DONE });
          return;
        }
        // Otherwise continue to next provider in fallback chain
      }
    }

    // Guaranteed Zosh Native fallback stream
    const nativeStart = Date.now();
    await this.native.stream(enrichedRequest, (chunk) => onEvent(chunk));
    aiTelemetry.finalizeTrace(traceCtx, {
      providerId: ProviderId.ZOSH_NATIVE,
      model: this.native.spec.defaultModel,
      success: true,
    });

    onEvent({
      type: AIStreamEventType.DONE,
      providerId: ProviderId.ZOSH_NATIVE,
      durationMs: Date.now() - nativeStart,
    });
  }

  getMeshHealth() {
    return healthMonitor.getAllHealth();
  }

  getTelemetryMetrics() {
    return aiTelemetry.getAggregatedMetrics();
  }
}

export const aiGateway = new AIGateway();
