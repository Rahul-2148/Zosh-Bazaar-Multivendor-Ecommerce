/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - OPENAI PROVIDER ADAPTER
 * Official OpenAI GPT-4o / GPT-4o-mini provider adapter.
 */

import { OpenAICompatibleProvider } from './openaiCompatible.provider.js';
import { ProviderId, PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super(
      ProviderId.OPENAI,
      PROVIDER_SPECIFICATIONS[ProviderId.OPENAI],
      process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      'OPENAI_API_KEY'
    );
  }
}
