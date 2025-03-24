const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/app-build-manifest.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: require.resolve('encoding'),
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS || '0x089D37C1Ca872221E37487c1F2D006907561B1fd',
    NEXT_PUBLIC_CUSD_ADDRESS: process.env.NEXT_PUBLIC_CUSD_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    NEXT_PUBLIC_CEUR_ADDRESS: process.env.NEXT_PUBLIC_CEUR_ADDRESS || '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  },
  output: 'standalone',
}

module.exports = withPWA(nextConfig)
