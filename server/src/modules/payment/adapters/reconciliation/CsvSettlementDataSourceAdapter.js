import SettlementDataSourceAdapter from "./SettlementDataSourceAdapter.js";

/**
 * CSV / Tabular Settlement Data Source Adapter
 * Parses external provider settlement feeds (e.g. Sandbox CSV fixtures, Gateway exports).
 */
export class CsvSettlementDataSourceAdapter extends SettlementDataSourceAdapter {
  constructor() {
    super("CSV_SETTLEMENT_ADAPTER");
  }

  /**
   * Parse CSV string or JSON array into normalized settlement records.
   */
  async parseSettlementData(rawContent) {
    if (!rawContent) return [];

    // If already parsed objects
    if (Array.isArray(rawContent)) {
      return rawContent.map((row) => ({
        externalReference: row.externalReference || row.settlement_id || row.id || `ext_${Date.now()}`,
        providerReference: row.providerReference || row.payment_id || row.pay_id || "",
        amount: Number(row.amount || 0),
        currency: row.currency || "INR",
        fee: Number(row.fee || 0),
        tax: Number(row.tax || 0),
        status: (row.status || "SETTLED").toUpperCase(),
        settledAt: row.settledAt ? new Date(row.settledAt) : new Date(),
      }));
    }

    const lines = String(rawContent)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      records.push({
        externalReference:
          row["settlement_id"] || row["external_ref"] || row["id"] || row["transaction_id"] || `ext_${Date.now()}_${i}`,
        providerReference: row["gateway_reference"] || row["payment_id"] || row["provider_ref"] || row["ref"] || row["transaction_id"] || row["txn_id"] || "",
        amount: Number(row["amount"] || 0),
        currency: (row["currency"] || "INR").toUpperCase(),
        fee: Number(row["fee"] || 0),
        tax: Number(row["tax"] || 0),
        status: (row["status"] || "SETTLED").toUpperCase(),
        settledAt: row["settled_at"] || row["settlement_date"] ? new Date(row["settled_at"] || row["settlement_date"]) : new Date(),
      });
    }

    return records;
  }

  /**
   * Alias for parseSettlementData
   */
  async parseSettlementRecords(rawContent) {
    return this.parseSettlementData(rawContent);
  }
}

export const csvSettlementDataSourceAdapter = new CsvSettlementDataSourceAdapter();
export default csvSettlementDataSourceAdapter;
