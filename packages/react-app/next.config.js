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
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
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
    NEXT_PUBLIC_CUSD_ADDRESS: process.env.NEXT_PUBLIC_CUSD_ADDRESS || '0x765de816845861e75a25fca122bb6898b8b1282a',
    NEXT_PUBLIC_CEUR_ADDRESS: process.env.NEXT_PUBLIC_CEUR_ADDRESS || '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
  },
  output: 'standalone',
}

module.exports = withPWA(nextConfig)