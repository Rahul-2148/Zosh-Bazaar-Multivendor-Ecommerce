import React, { type ComponentType, type LazyExoticComponent } from "react";

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
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem(`zosh_partner_chunk_reload_${window.location.pathname}`);
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
              const storageKey = `zosh_partner_chunk_reload_${window.location.pathname}`;
              const hasReloaded = sessionStorage.getItem(storageKey);

              if (!hasReloaded) {
                sessionStorage.setItem(storageKey, "true");
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

export function registerDynamicImportRecovery(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const storageKey = `zosh_partner_vite_preload_${window.location.pathname}`;
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, "true");
      window.location.reload();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (isDynamicImportError(reason)) {
      event.preventDefault();
      const storageKey = `zosh_partner_unhandled_${window.location.pathname}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, "true");
        window.location.reload();
      }
    }
  });
}

export default lazyWithRetry;
