/**
 * Navigation and redirect security helpers
 */

/**
 * Validates that a path is a safe internal relative path to prevent Open Redirect vulnerabilities.
 * A safe relative path must start with a single "/" and not start with "//" or contain protocol schemes.
 */
export const isSafeInternalPath = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Must start with / and not // (protocol-relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }
  // Must not contain schemes like javascript:, data:, or https:
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }
  return true;
};

/**
 * Resolves the destination URL after successful authentication.
 * Checks search params (?returnTo=...), React Router location state, or defaults to fallback ("/").
 */
export const getSafeReturnUrl = (
  source?: URLSearchParams | string | null,
  locationState?: any,
  fallback = "/"
): string => {
  if (typeof source === "string") {
    if (isSafeInternalPath(source)) return source;
    try {
      const parsed = new URL(source, "http://dummy.internal");
      const relative = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (isSafeInternalPath(relative)) return relative;
    } catch {
      // ignore
    }
    return fallback;
  }

  const fromParam = source?.get("returnTo");
  if (fromParam && isSafeInternalPath(fromParam)) {
    return fromParam;
  }

  const fromState = locationState?.from?.pathname
    ? `${locationState.from.pathname}${locationState.from.search || ""}`
    : null;
  if (fromState && isSafeInternalPath(fromState)) {
    return fromState;
  }

  return fallback;
};

/**
 * Builds an auth redirect URL preserving current pathname, search params, and optional action intent.
 */
export const buildAuthRedirectUrl = (
  pathname: string,
  search = "",
  intent?: { action: string; [key: string]: any }
): string => {
  const fullPath = `${pathname}${search}`;
  const params = new URLSearchParams();
  params.set("returnTo", fullPath);

  if (intent) {
    params.set("intent", intent.action);
    Object.entries(intent).forEach(([k, v]) => {
      if (k !== "action" && v !== undefined && v !== null) {
        params.set(`intent_${k}`, String(v));
      }
    });
  }

  return `/login?${params.toString()}`;
};
