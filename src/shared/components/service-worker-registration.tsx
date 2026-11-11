'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const enableServiceWorker =
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === 'true';

    const cleanupServiceWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map(async (registration) => {
            const scriptUrl = registration.active?.scriptURL
              ?? registration.waiting?.scriptURL
              ?? registration.installing?.scriptURL
              ?? '';

            if (scriptUrl.includes('/sw.js')) {
              await registration.unregister();
            }
          })
        );

        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith('z-image-ai-'))
            .map((key) => caches.delete(key))
        );
      } catch (error) {
        console.error('Service Worker cleanup failed:', error);
      }
    };

    if (!enableServiceWorker) {
      void cleanupServiceWorkers();
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    };

    window.addEventListener('load', registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}
