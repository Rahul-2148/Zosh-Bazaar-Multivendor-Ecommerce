/**
 * Abstract Settlement Data Source Adapter
 * Defines the contract for importing external payment gateway / bank settlement files
 * (e.g. Razorpay Settlement Daily CSV, Bank nodal statement, Card network raw logs).
 */
export class SettlementDataSourceAdapter {
  constructor(name) {
    if (new.target === SettlementDataSourceAdapter) {
      throw new TypeError("Cannot construct SettlementDataSourceAdapter instances directly");
    }
    this.name = name;
  }

  /**
   * Parse raw file content/stream and normalize into standard settlement records.
   * @param {string|Buffer} rawContent
   * @returns {Promise<Array<{
   *   externalReference: string,
   *   providerReference: string,
   *   amount: number,
   *   currency: string,
   *   fee: number,
   *   tax: number,
   *   status: string,
   *   settledAt: Date
   * }>>}
   */
  async parseSettlementData(_rawContent) {
    throw new Error(`[${this.name}] parseSettlementData() not implemented`);
  }
}

export default SettlementDataSourceAdapter;
