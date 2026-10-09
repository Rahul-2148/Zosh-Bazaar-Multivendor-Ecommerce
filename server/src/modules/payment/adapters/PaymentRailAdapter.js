/**
 * Abstract Payment Rail Adapter Interface
 * All payment providers (Razorpay, UPI, Cards, NetBanking, Sandbox, COD) must implement this contract.
 * The PaymentOrchestratorService exclusively communicates through this interface and NEVER imports third-party SDKs directly.
 */
export class PaymentRailAdapter {
  constructor(name, capabilities = {}) {
    if (new.target === PaymentRailAdapter) {
      throw new TypeError("Cannot construct PaymentRailAdapter instances directly");
    }
    this.name = name;
    this.provider = capabilities.provider || name;
    this.railType = capabilities.railType || "ALL";
    this.capabilities = {
      railType: "ALL",
      provider: name,
      environment: "sandbox",
      productionReady: false,
      supportsAuthorization: false,
      supportsCapture: false,
      supportsRefund: false,
      supportsPartialRefund: false,
      supportsWebhook: false,
      supportsPolling: false,
      supportsUPIIntent: false,
      supportsUPICollect: false,
      supportsUPIQR: false,
      supportsCards: false,
      supportsTokenization: false,
      supports3DS: false,
      supportsNetBanking: false,
      supportsEMI: false,
      supportsPayout: false,
      supportsReconciliation: false,
      supportsCOD: false,
      ...capabilities,
    };
  }

  /**
   * Check if adapter supports a specific capability.
   * @param {string} capability - Name of capability (e.g. 'supportsUPIIntent', 'supportsCapture')
   * @returns {boolean}
   */
  hasCapability(capability) {
    return Boolean(this.capabilities[capability]);
  }

  /**
   * Check if adapter is safe and verified for production financial traffic.
   */
  isProductionReady() {
    return Boolean(this.capabilities.productionReady);
  }

  /**
   * Enforce fail-closed check for uncertified adapters in production.
   */
  assertProductionReady(operationOrOptions = "payment operation", options = {}) {
    let operationName = "payment operation";
    let opts = options;
    if (typeof operationOrOptions === "object" && operationOrOptions !== null) {
      opts = operationOrOptions;
      operationName = opts.operationName || "payment operation";
    } else if (typeof operationOrOptions === "string") {
      operationName = operationOrOptions;
    }

    const isProd =
      opts.isProduction !== undefined
        ? opts.isProduction
        : operationName === "production" ||
          process.env.NODE_ENV === "production" ||
          process.env.PAYMENT_ENV === "production";
    if (isProd && !this.isProductionReady()) {
      const err = new Error(
        `[SECURITY_FAIL_CLOSED] Payment rail adapter "${this.name}" is not certified for production. Attempted: ${operationName}`
      );
      err.code = "RAIL_NOT_PRODUCTION_READY";
      err.statusCode = 503;
      throw err;
    }
  }

  /**
   * Return adapter capabilities descriptor.
   */
  getCapabilities() {
    return { ...this.capabilities };
  }

  /**
   * Top-level initiate payment method dispatching to createIntent with production safety guard.
   */
  async initiatePayment(params = {}) {
    this.assertProductionReady("initiatePayment");
    return this.createIntent(params);
  }

  /**
   * Initialize or register an intent with the downstream rail provider.
   * @param {Object} params - { intent, attempt, user, metadata }
   * @returns {Promise<{ providerReference: string, status: string, actionPayload?: any }>}
   */
  async createIntent(_params) {
    throw new Error(`[${this.name}] createIntent() not implemented`);
  }

  /**
   * Authorize a payment attempt (e.g. 3DS challenge, OTP, collect request).
   * @param {Object} params - { attempt, payload }
   * @returns {Promise<{ status: string, authorized: boolean, actionPayload?: any }>}
   */
  async authorize(_params) {
    throw new Error(`[${this.name}] authorize() not implemented`);
  }

  /**
   * Authoritative capture of authorized funds.
   * @param {Object} params - { attempt, payload }
   * @returns {Promise<{ status: string, captured: boolean, providerReference: string }>}
   */
  async capture(_params) {
    throw new Error(`[${this.name}] capture() not implemented`);
  }

  /**
   * Authoritatively query the status of a payment attempt from the rail.
   * @param {Object} params - { attempt }
   * @returns {Promise<{ status: string, providerReference: string, failureReason?: string }>}
   */
  async getStatus(_params) {
    throw new Error(`[${this.name}] getStatus() not implemented`);
  }

  /**
   * Cancel or void an in-flight payment attempt.
   * @param {Object} params - { attempt, reason }
   * @returns {Promise<{ cancelled: boolean, status: string }>}
   */
  async cancel(_params) {
    throw new Error(`[${this.name}] cancel() not implemented`);
  }

  /**
   * Dispatch a full or partial refund to the provider.
   * @param {Object} params - { refund, attempt, order }
   * @returns {Promise<{ gatewayRefundId: string, status: string }>}
   */
  async refund(_params) {
    throw new Error(`[${this.name}] refund() not implemented`);
  }

  /**
   * Refund payment alias for refund()
   */
  async refundPayment(params) {
    return this.refund(params);
  }

  /**
   * Query status of an in-flight refund.
   * @param {Object} params - { refund }
   * @returns {Promise<{ status: string, gatewayRefundId: string }>}
   */
  async getRefundStatus(_params) {
    throw new Error(`[${this.name}] getRefundStatus() not implemented`);
  }

  /**
   * Validate webhook cryptographic signature and normalize event payload.
   * @param {Object} params - { payload, signature, rawBody }
   * @returns {Promise<{ isValid: boolean, eventId: string, eventType: string, paymentReference?: string, normalizedStatus?: string }>}
   */
  async verifyWebhook(_params) {
    throw new Error(`[${this.name}] verifyWebhook() not implemented`);
  }

  /**
   * Fetch settlement reconciliation feed for a date range.
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise<Array<{ referenceId: string, amount: number, status: string, fee: number, tax: number }>>}
   */
  async reconcile(_params) {
    throw new Error(`[${this.name}] reconcile() not implemented`);
  }
}

export default PaymentRailAdapter;
