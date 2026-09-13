/**
 * Zosh Bazaar Email Platform — Custom Error Hierarchy
 */

export class EmailError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "EMAIL_ERROR";
    this.isTransient = Boolean(options.isTransient);
    this.details = options.details || {};
    this.timestamp = new Date();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class TransientEmailError extends EmailError {
  constructor(message, details = {}) {
    super(message, { code: "TRANSIENT_EMAIL_ERROR", isTransient: true, details });
  }
}

export class PermanentEmailError extends EmailError {
  constructor(message, details = {}) {
    super(message, { code: "PERMANENT_EMAIL_ERROR", isTransient: false, details });
  }
}

export class TemplateNotFoundError extends PermanentEmailError {
  constructor(templateKey) {
    super(`Email template not found: "${templateKey}"`, { templateKey });
  }
}

export class TemplateValidationError extends PermanentEmailError {
  constructor(templateKey, validationErrors) {
    super(`Template data validation failed for: "${templateKey}"`, {
      templateKey,
      validationErrors,
    });
  }
}

export class TemplateRenderError extends PermanentEmailError {
  constructor(templateKey, originalError) {
    super(`Failed to render template "${templateKey}": ${originalError.message}`, {
      templateKey,
      originalError: originalError.message,
    });
  }
}

export class ProviderUnavailableError extends TransientEmailError {
  constructor(providerName, reason) {
    super(`Email provider "${providerName}" is unavailable: ${reason}`, {
      providerName,
      reason,
    });
  }
}

export class IdempotencyConflictError extends EmailError {
  constructor(idempotencyKey) {
    super(`Email with idempotency key "${idempotencyKey}" is already processed or in-flight`, {
      code: "IDEMPOTENCY_CONFLICT",
      isTransient: false,
      idempotencyKey,
    });
  }
}
