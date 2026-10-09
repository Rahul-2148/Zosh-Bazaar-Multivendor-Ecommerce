/**
 * Provider-Neutral Payout Rail Adapter Interface
 * All automated seller payout integrations (Sandbox, Bank Nodal, RazorpayX, Cashfree Payouts)
 * must implement this contract.
 */
export class PayoutRailAdapter {
  constructor(name, capabilities = {}) {
    if (new.target === PayoutRailAdapter) {
      throw new TypeError("Cannot construct PayoutRailAdapter instances directly");
    }
    this.name = name;
    this.capabilities = {
      supportsInstantPayout: false,
      supportsBatchPayout: false,
      supportsReversal: false,
      supportsWebhook: false,
      productionReady: false,
      ...capabilities,
    };
  }

  isProductionReady() {
    return Boolean(this.capabilities.productionReady);
  }

  /**
   * Initiate a seller payout.
   * @param {Object} params - { sellerId, amount, currency, bankAccount, ifsc, referenceId }
   * @returns {Promise<{ payoutReference: string, status: string, utr?: string }>}
   */
  async createPayout(_params) {
    throw new Error(`[${this.name}] createPayout() not implemented`);
  }

  /**
   * Authoritatively query the status of an in-flight payout.
   * @param {Object} params - { payoutReference }
   * @returns {Promise<{ status: string, utr: string, failureReason?: string }>}
   */
  async getPayoutStatus(_params) {
    throw new Error(`[${this.name}] getPayoutStatus() not implemented`);
  }

  /**
   * Cancel an in-flight or pending payout.
   */
  async cancelPayout(_params) {
    throw new Error(`[${this.name}] cancelPayout() not implemented`);
  }

  /**
   * Retry a failed payout.
   */
  async retryPayout(_params) {
    throw new Error(`[${this.name}] retryPayout() not implemented`);
  }
}

export default PayoutRailAdapter;
