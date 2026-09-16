/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - DEEPSEEK PROVIDER ADAPTER
 * DeepSeek reasoning and chat completion provider adapter.
 */

import { OpenAICompatibleProvider } from './openaiCompatible.provider.js';
import { ProviderId, PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor() {
    super(
      ProviderId.DEEPSEEK,
      PROVIDER_SPECIFICATIONS[ProviderId.DEEPSEEK],
      process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      'DEEPSEEK_API_KEY'
    );
  }
}
