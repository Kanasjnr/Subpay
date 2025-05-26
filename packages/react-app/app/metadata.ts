import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#35D07F',
};

export const metadata: Metadata = {
  title: 'CeloSubPay',
  description: 'DeFi-based subscription payment protocol on Celo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CeloSubPay',
  },
  formatDetection: {
    telephone: false,
  },
}; 