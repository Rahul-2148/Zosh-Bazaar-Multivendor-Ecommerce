/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - BASE PROVIDER ADAPTER
 * Common contract for all AI LLM providers.
 */

import { AIErrorReason, AIGatewayError } from '../schemas/normalizedTypes.js';

export class BaseAIProvider {
  constructor(providerId, spec) {
    this.providerId = providerId;
    this.spec = spec;
  }

  getCapabilities() {
    return this.spec?.capabilities || [];
  }

  isConfigured() {
    throw new Error('Method isConfigured() must be implemented');
  }

  async generate(_request) {
    throw new Error('Method generate() must be implemented');
  }

  async stream(_request, _onChunk) {
    throw new Error('Method stream() must be implemented');
  }

  async generateStructured(_request, _schema) {
    throw new Error('Method generateStructured() must be implemented');
  }

  async healthCheck() {
    throw new Error('Method healthCheck() must be implemented');
  }

  classifyHttpError(status, errorData = null, originalError = null) {
    let reason = AIErrorReason.UNKNOWN_ERROR;
    let retryable = false;

    if (status === 429) {
      reason = AIErrorReason.RATE_LIMITED;
      retryable = true;
    } else if (status === 401 || status === 403) {
      reason = AIErrorReason.AUTH_ERROR;
      retryable = false;
    } else if (status === 408 || status === 504) {
      reason = AIErrorReason.TIMEOUT;
      retryable = true;
    } else if (status === 500 || status === 502 || status === 503) {
      reason = AIErrorReason.PROVIDER_OVERLOADED;
      retryable = true;
    }

    const message = errorData?.error?.message || errorData?.message || originalError?.message || `HTTP ${status}`;
    return new AIGatewayError(reason, message, this.providerId, originalError, retryable);
  }
}
