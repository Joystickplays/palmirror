/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist, type RuntimeCaching, CacheFirst, StaleWhileRevalidate, NetworkFirst, ExpirationPlugin } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: any;
};

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    handler: new CacheFirst({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:css|js)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: async ({ request, event }) => {
      const strategy = new NetworkFirst({
        cacheName: "pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
          }),
        ],
      });

      try {
        const response = await strategy.handle({ request, event });
        if (response) return response;
        throw new Error("No response from NetworkFirst");
      } catch (error) {
        // Return the cached home page as a fallback to allow the app to load
        // even if the specific page wasn't cached.
        const cache = await caches.open("pages");
        const cachedResponse = await cache.match("/", {
          ignoreSearch: true,
        });
        
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    },
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();