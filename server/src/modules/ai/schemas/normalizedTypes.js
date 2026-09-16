/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - NORMALIZED TYPES & STREAM EVENTS
 */

export const AIStreamEventType = {
  START: 'start',
  STEP: 'step',
  TOKEN: 'token',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  PAYLOAD: 'payload',
  ERROR: 'error',
  DONE: 'done',
};

export const AIErrorReason = {
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  AUTH_ERROR: 'AUTH_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  PROVIDER_OVERLOADED: 'PROVIDER_OVERLOADED',
  CAPABILITY_MISMATCH: 'CAPABILITY_MISMATCH',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export class AIGatewayError extends Error {
  constructor(reason, message, providerId = null, originalError = null, retryable = false) {
    super(message);
    this.name = 'AIGatewayError';
    this.reason = reason;
    this.providerId = providerId;
    this.originalError = originalError;
    this.retryable = retryable;
  }
}
