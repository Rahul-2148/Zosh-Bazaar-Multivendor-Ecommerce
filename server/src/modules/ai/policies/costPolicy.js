/**
 * ZOSH BAZAAR AI ECOSYSTEM 4.0 - COST POLICY
 * Calculates token accounting and estimated dollar/rupee cost.
 */

import { PROVIDER_SPECIFICATIONS } from '../schemas/providerCapabilities.js';

const USD_TO_INR = 85.0;

export function estimateTokenCost(providerId, promptTokens = 0, completionTokens = 0) {
  const spec = PROVIDER_SPECIFICATIONS[providerId];
  if (!spec || !spec.pricing) {
    return { promptCostUsd: 0, completionCostUsd: 0, totalCostUsd: 0, totalCostInr: 0 };
  }

  const inputRate = spec.pricing.inputPerMillion ?? spec.pricing.promptPerMillion ?? 0;
  const outputRate = spec.pricing.outputPerMillion ?? spec.pricing.completionPerMillion ?? 0;

  const promptCostUsd = (promptTokens / 1_000_000) * inputRate;
  const completionCostUsd = (completionTokens / 1_000_000) * outputRate;
  const totalCostUsd = promptCostUsd + completionCostUsd;
  const totalCostInr = totalCostUsd * USD_TO_INR;

  return {
    promptCostUsd: Number(promptCostUsd.toFixed(6)),
    completionCostUsd: Number(completionCostUsd.toFixed(6)),
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    totalCostInr: Number(totalCostInr.toFixed(4)),
  };
}
