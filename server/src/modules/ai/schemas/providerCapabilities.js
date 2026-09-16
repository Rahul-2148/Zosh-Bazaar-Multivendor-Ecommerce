import { AICapability } from "./capabilities.js";

/**
 * Registry of Provider and Model Capabilities, Rate Limits, and Costs.
 * Costs expressed in USD per 1M tokens.
 */
export const ProviderId = Object.freeze({
  GEMINI: "gemini",
  GROQ: "groq",
  DEEPSEEK: "deepseek",
  OPENAI: "openai",
  ZOSH_NATIVE: "zosh_native",
});

export const PROVIDER_SPECIFICATIONS = Object.freeze({
  [ProviderId.GEMINI]: {
    name: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
    fallbackModel: "gemini-1.5-flash",
    capabilities: [
      AICapability.CHAT,
      AICapability.STREAMING,
      AICapability.TOOL_CALLING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.VISION,
      AICapability.LONG_CONTEXT,
      AICapability.FAST_RESPONSE,
      AICapability.JSON_OUTPUT,
    ],
    maxContextTokens: 1048576,
    pricing: {
      inputPerMillion: 0.10,
      outputPerMillion: 0.40,
    },
    latencyTierMs: 350,
  },
  [ProviderId.GROQ]: {
    name: "Groq LPU",
    defaultModel: "llama-3.3-70b-versatile",
    fallbackModel: "llama-3.1-8b-instant",
    capabilities: [
      AICapability.CHAT,
      AICapability.STREAMING,
      AICapability.TOOL_CALLING,
      AICapability.FAST_RESPONSE,
      AICapability.JSON_OUTPUT,
      AICapability.STRUCTURED_OUTPUT,
    ],
    maxContextTokens: 131072,
    pricing: {
      inputPerMillion: 0.59,
      outputPerMillion: 0.79,
    },
    latencyTierMs: 180,
  },
  [ProviderId.DEEPSEEK]: {
    name: "DeepSeek AI",
    defaultModel: "deepseek-chat",
    fallbackModel: "deepseek-reasoner",
    capabilities: [
      AICapability.CHAT,
      AICapability.STREAMING,
      AICapability.DEEP_REASONING,
      AICapability.JSON_OUTPUT,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.LONG_CONTEXT,
    ],
    maxContextTokens: 65536,
    pricing: {
      inputPerMillion: 0.14,
      outputPerMillion: 0.28,
    },
    latencyTierMs: 450,
  },
  [ProviderId.OPENAI]: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-4o",
    capabilities: [
      AICapability.CHAT,
      AICapability.STREAMING,
      AICapability.TOOL_CALLING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.VISION,
      AICapability.JSON_OUTPUT,
    ],
    maxContextTokens: 128000,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.60,
    },
    latencyTierMs: 400,
  },
  [ProviderId.ZOSH_NATIVE]: {
    name: "Zosh Native Commerce AI",
    defaultModel: "zosh-catalog-grounded-v4",
    fallbackModel: "zosh-deterministic-core",
    capabilities: [
      AICapability.CHAT,
      AICapability.STREAMING,
      AICapability.TOOL_CALLING,
      AICapability.STRUCTURED_OUTPUT,
      AICapability.FAST_RESPONSE,
      AICapability.EMBEDDING,
    ],
    maxContextTokens: 32768,
    pricing: {
      inputPerMillion: 0.0,
      outputPerMillion: 0.0,
    },
    latencyTierMs: 25,
  },
});
