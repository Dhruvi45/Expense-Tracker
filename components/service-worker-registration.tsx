"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);

        // Check for an update every time the page gains focus
        const checkForUpdate = () => registration.update();
        window.addEventListener("focus", checkForUpdate);

        // When the SW waiting to activate (new version downloaded)
        const onUpdateFound = () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is ready – ask the user to reload
              const shouldReload = window.confirm(
                "A new version of the app is available. Reload to update?"
              );
              if (shouldReload) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            }
          });
        };

        registration.addEventListener("updatefound", onUpdateFound);

        // Reload the page after the new SW takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        return () => {
          window.removeEventListener("focus", checkForUpdate);
          registration.removeEventListener("updatefound", onUpdateFound);
        };
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }, []);

  return null;
}
