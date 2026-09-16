/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - OPENAI-COMPATIBLE ADAPTER BASE
 * Shared implementation for OpenAI, Groq, and DeepSeek chat completion endpoints.
 */

import { BaseAIProvider } from './base.provider.js';
import { getOpenAIToolDeclarations } from '../tools/toolRegistry.js';
import { AIErrorReason, AIGatewayError } from '../schemas/normalizedTypes.js';

export class OpenAICompatibleProvider extends BaseAIProvider {
  constructor(providerId, spec, baseUrl, envKeyName) {
    super(providerId, spec);
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.envKeyName = envKeyName;
  }

  isConfigured() {
    return Boolean(process.env[this.envKeyName]);
  }

  getApiKey() {
    return process.env[this.envKeyName];
  }

  getModel() {
    return process.env[`${this.providerId.toUpperCase()}_MODEL`] || this.spec.defaultModel;
  }

  _formatMessages(request) {
    const msgs = [];
    if (request.systemInstruction) {
      msgs.push({ role: 'system', content: request.systemInstruction });
    }
    if (Array.isArray(request.messages)) {
      for (const m of request.messages) {
        msgs.push({
          role: m.role || 'user',
          content: m.content || '',
          ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
          ...(m.name ? { name: m.name } : {}),
        });
      }
    } else if (request.prompt) {
      msgs.push({ role: 'user', content: request.prompt });
    }
    return msgs;
  }

  async generate(request) {
    if (!this.isConfigured()) {
      throw new AIGatewayError(AIErrorReason.AUTH_ERROR, `${this.providerId} API key is not configured`, this.providerId);
    }

    const model = request.model || this.getModel();
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model,
      messages: this._formatMessages(request),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
    };

    if (request.includeTools) {
      body.tools = getOpenAIToolDeclarations();
      body.tool_choice = 'auto';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs || 25000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw this.classifyHttpError(res.status, errorData);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      const toolCalls = (message?.tool_calls || []).map((tc) => {
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments);
        } catch {
          parsedArgs = { raw: tc.function.arguments };
        }
        return {
          id: tc.id,
          name: tc.function.name,
          args: parsedArgs,
        };
      });

      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      return {
        providerId: this.providerId,
        model,
        text: message?.content || '',
        toolCalls,
        finishReason: choice?.finish_reason || 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: data.usage?.total_tokens || (promptTokens + completionTokens),
        },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AIGatewayError(AIErrorReason.TIMEOUT, `${this.providerId} request timed out`, this.providerId, err, true);
      }
      if (err instanceof AIGatewayError) throw err;
      throw new AIGatewayError(AIErrorReason.NETWORK_ERROR, err.message, this.providerId, err, true);
    }
  }

  async stream(request, onChunk) {
    if (!this.isConfigured()) {
      throw new AIGatewayError(AIErrorReason.AUTH_ERROR, `${this.providerId} API key is not configured`, this.providerId);
    }

    const model = request.model || this.getModel();
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model,
      messages: this._formatMessages(request),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      stream: true,
    };

    if (request.includeTools) {
      body.tools = getOpenAIToolDeclarations();
      body.tool_choice = 'auto';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs || 30000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw this.classifyHttpError(res.status, errorData);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let totalText = '';
      const toolCallsMap = new Map();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              totalText += delta.content;
              onChunk({ type: 'token', token: delta.content });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, {
                    id: tc.id || `tc_${Date.now()}_${idx}`,
                    name: tc.function?.name || '',
                    argsStr: tc.function?.arguments || '',
                  });
                } else {
                  const existing = toolCallsMap.get(idx);
                  if (tc.function?.name) existing.name += tc.function.name;
                  if (tc.function?.arguments) existing.argsStr += tc.function.arguments;
                }
              }
            }
          } catch {
            // Ignore partial lines
          }
        }
      }

      const finalToolCalls = [];
      for (const [, tc] of toolCallsMap.entries()) {
        let parsed = {};
        try {
          parsed = JSON.parse(tc.argsStr);
        } catch {
          parsed = { raw: tc.argsStr };
        }
        const call = { id: tc.id, name: tc.name, args: parsed };
        finalToolCalls.push(call);
        onChunk({ type: 'tool_call', call });
      }

      return {
        providerId: this.providerId,
        model,
        text: totalText,
        toolCalls: finalToolCalls,
        finishReason: 'stop',
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AIGatewayError(AIErrorReason.TIMEOUT, `${this.providerId} stream timed out`, this.providerId, err, true);
      }
      if (err instanceof AIGatewayError) throw err;
      throw new AIGatewayError(AIErrorReason.NETWORK_ERROR, err.message, this.providerId, err, true);
    }
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return { configured: false, healthy: false, reason: 'Key not set' };
    }
    const start = Date.now();
    try {
      await this.generate({
        prompt: 'Ping',
        maxTokens: 5,
        timeoutMs: 5000,
      });
      return { configured: true, healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { configured: true, healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}
