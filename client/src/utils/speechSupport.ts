/**
 * Cross-browser Speech Recognition Support Check
 * Detects whether the current browser engine (Chrome, Edge, Safari, Opera, Mobile Chrome)
 * supports the Web Speech Recognition API.
 * Returns false on desktop Firefox where the API is disabled/unsupported by default.
 */
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
};
