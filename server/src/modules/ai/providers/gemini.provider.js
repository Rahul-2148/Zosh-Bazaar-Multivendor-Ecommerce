/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - GEMINI PROVIDER ADAPTER
 * Connects to Google Gemini via official REST endpoints with streaming and tool calling.
 */

import { BaseAIProvider } from './base.provider.js';
import { ProviderId, PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';
import { getGeminiToolDeclarations } from '../tools/toolRegistry.js';
import { AIErrorReason, AIGatewayError } from '../schemas/normalizedTypes.js';

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super(ProviderId.GEMINI, PROVIDER_SPECIFICATIONS[ProviderId.GEMINI]);
  }

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  getModel() {
    return process.env.GEMINI_MODEL || this.spec.defaultModel;
  }

  _formatContents(messages) {
    const contents = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (m.parts) {
        contents.push({ role, parts: m.parts });
      } else if (m.content) {
        contents.push({ role, parts: [{ text: m.content }] });
      }
    }
    return contents;
  }

  async generate(request) {
    if (!this.isConfigured()) {
      throw new AIGatewayError(AIErrorReason.AUTH_ERROR, 'Gemini API key is not configured', this.providerId);
    }

    const model = request.model || this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.getApiKey()}`;

    const body = {
      contents: this._formatContents(request.messages || [{ role: 'user', content: request.prompt }]),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };

    if (request.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: request.systemInstruction }],
      };
    }

    if (request.includeTools) {
      body.tools = getGeminiToolDeclarations();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs || 25000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw this.classifyHttpError(res.status, errorData);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];

      let text = '';
      const toolCalls = [];

      if (candidate?.content?.parts) {
        for (const p of candidate.content.parts) {
          if (p.text) text += p.text;
          if (p.functionCall) {
            toolCalls.push({
              id: `gemini_call_${Date.now()}`,
              name: p.functionCall.name,
              args: p.functionCall.args || {},
            });
          }
        }
      }

      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

      return {
        providerId: this.providerId,
        model,
        text,
        toolCalls,
        finishReason: candidate?.finishReason || 'STOP',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AIGatewayError(AIErrorReason.TIMEOUT, 'Gemini request timed out', this.providerId, err, true);
      }
      if (err instanceof AIGatewayError) throw err;
      throw new AIGatewayError(AIErrorReason.NETWORK_ERROR, err.message, this.providerId, err, true);
    }
  }

  async stream(request, onChunk) {
    if (!this.isConfigured()) {
      throw new AIGatewayError(AIErrorReason.AUTH_ERROR, 'Gemini API key is not configured', this.providerId);
    }

    const model = request.model || this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.getApiKey()}`;

    const body = {
      contents: this._formatContents(request.messages || [{ role: 'user', content: request.prompt }]),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };

    if (request.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: request.systemInstruction }],
      };
    }

    if (request.includeTools) {
      body.tools = getGeminiToolDeclarations();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs || 30000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const toolCalls = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep remaining unfinished line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const candidate = parsed.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  totalText += part.text;
                  onChunk({ type: 'token', token: part.text });
                }
                if (part.functionCall) {
                  const call = {
                    id: `gemini_call_${Date.now()}`,
                    name: part.functionCall.name,
                    args: part.functionCall.args || {},
                  };
                  toolCalls.push(call);
                  onChunk({ type: 'tool_call', call });
                }
              }
            }
          } catch {
            // Ignore parse errors on individual SSE frames
          }
        }
      }

      return {
        providerId: this.providerId,
        model,
        text: totalText,
        toolCalls,
        finishReason: 'STOP',
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AIGatewayError(AIErrorReason.TIMEOUT, 'Gemini stream timed out', this.providerId, err, true);
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
