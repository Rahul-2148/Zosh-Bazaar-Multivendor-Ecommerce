export { emailService, default as emailServiceDefault } from "./core/email.service.js";
export { emailDispatcher } from "./core/email.dispatcher.js";
export { emailRegistry } from "./core/email.registry.js";
export { emailRenderer } from "./core/email.renderer.js";
export { emailEvents, emitDomainEvent, DOMAIN_EVENT_TO_TEMPLATES } from "./core/email.events.js";
export {
  EmailRecipientRole,
  EmailCategory,
  EmailPriority,
  EmailDeliveryStatus,
  EmailProviderType,
} from "./core/email.types.js";
export { EMAIL_TEMPLATES } from "./templates/index.js";
export { emailQueue } from "./queue/email.queue.js";
export { startEmailWorker, stopEmailWorker } from "./queue/email.worker.js";
export { emailConfig } from "./config/email.config.js";
export { brandConfig } from "./config/brand.config.js";

import { emailService } from "./core/email.service.js";
export default emailService;
