/**
 * ==============================================================================
 * ZOSH BAZAAR — CANONICAL MONEY & ARITHMETIC UTILITY (AUDIT COMPLIANT)
 * ==============================================================================
 * Enforces strict 2-decimal minor-unit arithmetic for INR / fiat currencies.
 * Prevents:
 * 1. Sub-paisa fractional amount injection (> 2 decimal places)
 * 2. Silent Math.round coercion of malformed amounts (e.g. 10.005 -> 10.01)
 * 3. Floating-point IEEE-754 drift accumulation
 * 4. Negative, zero (where forbidden), NaN, Infinite, or overflow amounts
 * ==============================================================================
 */

export const MAX_MONETARY_AMOUNT = 99999999.99; // ₹9.99 Crore upper bound for marketplace orders
export const MIN_MONETARY_AMOUNT = 0.01;        // ₹0.01 (1 paisa)

export class Money {
  /**
   * Validates monetary amount and enforces 2-decimal precision.
   * Throws MALFORMED_MONETARY_AMOUNT if more than two decimal places are present.
   *
   * @param {number|string} amount - The amount in rupees
   * @param {string} [fieldName="amount"] - Context identifier for audit logs
   * @param {Object} [options={}] - Validation options
   * @param {boolean} [options.allowZero=false] - Whether zero is permitted
   * @returns {number} The validated integer minor units (paise)
   */
  static validate(amount, fieldName = "amount", { allowZero = false } = {}) {
    if (amount === null || amount === undefined || amount === "") {
      const err = new Error(`Monetary field "${fieldName}" is required`);
      err.code = "MISSING_MONETARY_AMOUNT";
      err.statusCode = 422;
      throw err;
    }

    const num = Number(amount);

    if (Number.isNaN(num) || !Number.isFinite(num)) {
      const err = new Error(`Monetary field "${fieldName}" must be a valid finite number`);
      err.code = "INVALID_MONETARY_AMOUNT";
      err.statusCode = 422;
      throw err;
    }

    if (allowZero && num === 0) {
      return 0;
    }

    if (num <= 0) {
      const err = new Error(
        `Monetary field "${fieldName}" must be positive and strictly greater than zero (received ₹${amount})`
      );
      err.code = "NON_POSITIVE_MONETARY_AMOUNT";
      err.statusCode = 422;
      throw err;
    }

    if (num > MAX_MONETARY_AMOUNT) {
      const err = new Error(
        `Monetary field "${fieldName}" exceeds maximum permitted threshold of ₹${MAX_MONETARY_AMOUNT} (received ₹${amount})`
      );
      err.code = "MONETARY_AMOUNT_OVERFLOW";
      err.statusCode = 422;
      throw err;
    }

    // Adversarial Check: Reject fractional sub-paise amounts (> 2 decimal places)
    // Prevents silent Math.round coercion of amounts like 10.005 or 50.055
    const numStr = String(amount).trim();
    if (numStr.includes("e") || numStr.includes("E")) {
      const err = new Error(
        `Malformed monetary amount in "${fieldName}": Scientific notation is not permitted`
      );
      err.code = "MALFORMED_MONETARY_AMOUNT";
      err.statusCode = 422;
      throw err;
    }

    const minorUnitsRaw = num * 100;
    const minorUnitsRounded = Math.round(minorUnitsRaw);

    const decimalParts = numStr.split(".");
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      // If provided as a string, or if the numeric value cannot be represented as an exact integer number of paise within IEEE-754 tolerance:
      if (typeof amount === "string" || Math.abs(minorUnitsRaw - minorUnitsRounded) > 1e-5) {
        const err = new Error(
          `Malformed monetary amount in "${fieldName}" ("${amount}"): Fractional sub-paisa precision (more than 2 decimal places) is strictly prohibited`
        );
        err.code = "MALFORMED_MONETARY_AMOUNT";
        err.statusCode = 422;
        throw err;
      }
    }

    if (Math.abs(minorUnitsRaw - minorUnitsRounded) > 1e-5) {
      const err = new Error(
        `Malformed monetary amount in "${fieldName}" ("${amount}"): Fractional sub-paisa precision is strictly prohibited`
      );
      err.code = "MALFORMED_MONETARY_AMOUNT";
      err.statusCode = 422;
      throw err;
    }

    return minorUnitsRounded;
  }

  /**
   * Converts rupees to integer paise after validating exact 2-decimal precision.
   * @param {number|string} amount
   * @param {string} [fieldName="amount"]
   * @param {Object} [options={}]
   * @returns {number} Integer paise
   */
  static toMinorUnits(amount, fieldName = "amount", options = {}) {
    return this.validate(amount, fieldName, options);
  }

  /**
   * Converts integer paise back to rupees.
   * @param {number} minorUnits - Integer paise
   * @returns {number} Rupee decimal representation
   */
  static fromMinorUnits(minorUnits) {
    if (!Number.isInteger(minorUnits)) {
      throw new Error(`Minor units must be an integer, received: ${minorUnits}`);
    }
    return minorUnits / 100;
  }

  /**
   * Formats paise as standard INR 2-decimal string.
   * @param {number} minorUnits
   * @returns {string} e.g. "100.10"
   */
  static format(minorUnits) {
    return (this.fromMinorUnits(minorUnits)).toFixed(2);
  }

  /**
   * Exact minor-unit addition.
   */
  static add(amountA, amountB, fieldName = "addition") {
    const minorA = this.validate(amountA, `${fieldName}.A`, { allowZero: true });
    const minorB = this.validate(amountB, `${fieldName}.B`, { allowZero: true });
    return this.fromMinorUnits(minorA + minorB);
  }

  /**
   * Exact minor-unit subtraction.
   */
  static subtract(amountA, amountB, fieldName = "subtraction") {
    const minorA = this.validate(amountA, `${fieldName}.A`, { allowZero: true });
    const minorB = this.validate(amountB, `${fieldName}.B`, { allowZero: true });
    if (minorA < minorB) {
      const err = new Error(`Monetary subtraction underflow: ₹${amountA} < ₹${amountB}`);
      err.code = "MONETARY_UNDERFLOW";
      err.statusCode = 422;
      throw err;
    }
    return this.fromMinorUnits(minorA - minorB);
  }
}

export default Money;
