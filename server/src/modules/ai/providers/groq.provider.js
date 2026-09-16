/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - GROQ PROVIDER ADAPTER
 * Ultra-low-latency LPU inference adapter.
 */

import { OpenAICompatibleProvider } from './openaiCompatible.provider.js';
import { ProviderId, PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';

export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    super(
      ProviderId.GROQ,
      PROVIDER_SPECIFICATIONS[ProviderId.GROQ],
      process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      'GROQ_API_KEY'
    );
  }
}
