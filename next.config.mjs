import withPWAInit from "next-pwa";

const isDevelopment = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  sw: "sw.js",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cacheStartUrl: true,
  dynamicStartUrl: false,
  reloadOnOnline: false,
  disable: isDevelopment,
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/[^/]+\/$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "subflow-pages",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/_next\/static\/.+/i,
      handler: "CacheFirst",
      options: {
        cacheName: "subflow-next-static",
        expiration: {
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/fonts\/.+/i,
      handler: "CacheFirst",
      options: {
        cacheName: "subflow-fonts",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/(icon|manifest).+/i,
      handler: "CacheFirst",
      options: {
        cacheName: "subflow-pwa-assets",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
