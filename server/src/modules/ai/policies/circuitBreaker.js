/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - CIRCUIT BREAKER
 * Tracks provider failure states and prevents cascading failures/thundering herds.
 */

export const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation, all requests allowed
  OPEN: 'OPEN',           // Tripped, fast-failing without calling provider
  HALF_OPEN: 'HALF_OPEN', // Testing recovery with canary probe requests
};

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    this.states = new Map();
  }

  _getState(providerId) {
    if (!this.states.has(providerId)) {
      this.states.set(providerId, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextProbeTime: null,
        lastErrorReason: null,
      });
    }
    return this.states.get(providerId);
  }

  canExecute(providerId) {
    const s = this._getState(providerId);
    const now = Date.now();

    if (s.state === CircuitState.CLOSED) {
      return true;
    }

    if (s.state === CircuitState.OPEN) {
      if (now >= s.nextProbeTime) {
        s.state = CircuitState.HALF_OPEN;
        s.successCount = 0;
        return true;
      }
      return false;
    }

    if (s.state === CircuitState.HALF_OPEN) {
      // In half-open, we allow single probe attempts
      return true;
    }

    return false;
  }

  recordSuccess(providerId) {
    const s = this._getState(providerId);
    if (s.state === CircuitState.HALF_OPEN) {
      s.successCount += 1;
      if (s.successCount >= this.halfOpenSuccessThreshold) {
        s.state = CircuitState.CLOSED;
        s.failureCount = 0;
        s.successCount = 0;
        s.lastFailureTime = null;
        s.nextProbeTime = null;
        s.lastErrorReason = null;
      }
    } else if (s.state === CircuitState.CLOSED) {
      s.failureCount = 0;
    }
  }

  recordFailure(providerId, errorReason = 'UNKNOWN_ERROR') {
    const s = this._getState(providerId);
    const now = Date.now();
    s.lastFailureTime = now;
    s.lastErrorReason = errorReason;

    if (s.state === CircuitState.HALF_OPEN) {
      // Canary failed, trip back to OPEN
      s.state = CircuitState.OPEN;
      s.nextProbeTime = now + this.resetTimeoutMs;
    } else if (s.state === CircuitState.CLOSED) {
      s.failureCount += 1;
      if (s.failureCount >= this.failureThreshold) {
        s.state = CircuitState.OPEN;
        s.nextProbeTime = now + this.resetTimeoutMs;
      }
    }
  }

  getStatus(providerId) {
    const s = this._getState(providerId);
    const now = Date.now();
    let effectiveState = s.state;
    if (s.state === CircuitState.OPEN && now >= s.nextProbeTime) {
      effectiveState = CircuitState.HALF_OPEN;
    }
    return {
      state: effectiveState,
      failureCount: s.failureCount,
      lastFailureTime: s.lastFailureTime,
      nextProbeTime: s.nextProbeTime,
      lastErrorReason: s.lastErrorReason,
    };
  }

  reset(providerId) {
    if (providerId) {
      this.states.delete(providerId);
    } else {
      this.states.clear();
    }
  }
}

export const circuitBreaker = new CircuitBreaker();
