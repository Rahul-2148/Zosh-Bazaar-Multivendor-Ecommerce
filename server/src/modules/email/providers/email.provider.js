/**
 * Abstract Base Email Provider
 */

export class EmailProvider {
  constructor(name) {
    if (new.target === EmailProvider) {
      throw new TypeError("Cannot construct EmailProvider instances directly");
    }
    this.name = name;
  }

  /**
   * Send an email.
   * @param {Object} options
   * @param {string} options.to
   * @param {string} options.subject
   * @param {string} options.html
   * @param {string} [options.text]
   * @param {string} [options.from]
   * @param {string} [options.replyTo]
   * @param {Array} [options.attachments]
   * @param {Object} [options.headers]
   * @returns {Promise<{ success: boolean, messageId: string, rawResponse?: any }>}
   */
  async send(_options) {
    throw new Error("Method 'send()' must be implemented by subclass.");
  }

  /**
   * Verify provider connectivity / credentials.
   * @returns {Promise<boolean>}
   */
  async verify() {
    return true;
  }
}
