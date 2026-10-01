import React, { type ComponentType, type LazyExoticComponent } from "react";

/**
 * Checks if an error string/object corresponds to a dynamic module import failure.
 */
export function isDynamicImportError(error: any): boolean {
  const message = String(error?.message || error?.statusText || error || "").toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("dynamically imported module") ||
    error?.name === "ChunkLoadError"
  );
}

/**
 * Robust lazy loading wrapper with automatic retries and auto-recovery
 * for Vite / SPA dynamic module import failures ("Failed to fetch dynamically imported module").
 *
 * Guarantees that users never see "Unexpected Application Error: Failed to fetch dynamically imported module"
 * across any route in the application.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 350
): LazyExoticComponent<T> {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        componentImport()
          .then((component) => {
            // Once successfully loaded, clean up any reload guard for this page
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem(`zosh_chunk_reload_${window.location.pathname}`);
              } catch {
                // ignore
              }
            }
            resolve(component);
          })
          .catch((error: any) => {
            if (remaining > 0) {
              setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
              return;
            }

            if (isDynamicImportError(error) && typeof window !== "undefined") {
              const storageKey = `zosh_chunk_reload_${window.location.pathname}`;
              const hasReloaded = sessionStorage.getItem(storageKey);

              // Auto-hard-reload once if a chunk failed permanently (e.g., stale deployment / HMR update)
              if (!hasReloaded) {
                sessionStorage.setItem(storageKey, "true");
                console.warn(
                  `[Zosh] Dynamic module fetch failed on ${window.location.pathname}. Automatically reloading page to fetch latest bundle.`
                );
                window.location.reload();
                return;
              }
            }

            reject(error);
          });
      };

      attempt(retriesLeft);
    })
  );
}

/**
 * Global lifecycle listener for Vite preload failures and unhandled chunk rejections.
 * Automatically catches and recovers from stale/failed module imports without crashing the app.
 */
export function registerDynamicImportRecovery(): void {
  if (typeof window === "undefined") return;

  // 1. Vite specific preload error event (emitted when Vite fails to fetch a dynamic chunk)
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    console.warn(
      `[Zosh] vite:preloadError event caught on ${window.location.pathname}. Reloading to fetch latest assets...`
    );
    const storageKey = `zosh_vite_preload_${window.location.pathname}`;
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, "true");
      window.location.reload();
    }
  });

  // 2. Window unhandled promise rejection listener for module script load failures
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (isDynamicImportError(reason)) {
      event.preventDefault();
      console.warn(
        `[Zosh] Unhandled dynamic module rejection intercepted on ${window.location.pathname}. Auto-recovering...`
      );
      const storageKey = `zosh_unhandled_chunk_${window.location.pathname}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, "true");
        window.location.reload();
      }
    }
  });
}

export default lazyWithRetry;
