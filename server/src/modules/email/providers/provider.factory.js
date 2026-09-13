import { NodemailerProvider } from "./nodemailer.provider.js";
import { SmtpProvider } from "./smtp.provider.js";
import { MockEmailProvider } from "./mock.provider.js";
import { emailConfig } from "../config/email.config.js";
import { EmailProviderType } from "../core/email.types.js";

class ProviderFactory {
  constructor() {
    this.instances = new Map();
    this.defaultType = emailConfig.provider;
  }

  setProvider(type) {
    this.defaultType = type;
  }

  getProvider(type = this.defaultType) {
    const normalizedType = (type || EmailProviderType.MOCK).toLowerCase();

    if (this.instances.has(normalizedType)) {
      return this.instances.get(normalizedType);
    }

    let providerInstance;
    switch (normalizedType) {
      case EmailProviderType.NODEMAILER:
        providerInstance = new NodemailerProvider();
        break;
      case EmailProviderType.SMTP:
        providerInstance = new SmtpProvider();
        break;
      case EmailProviderType.MOCK:
      default:
        providerInstance = new MockEmailProvider();
        break;
    }

    this.instances.set(normalizedType, providerInstance);
    return providerInstance;
  }
}

export const providerFactory = new ProviderFactory();
export default providerFactory;
