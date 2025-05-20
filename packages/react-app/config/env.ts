import { getAddress } from 'viem'

// Environment variable validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS,
  NEXT_PUBLIC_CUSD_ADDRESS: process.env.NEXT_PUBLIC_CUSD_ADDRESS,
  NEXT_PUBLIC_CEUR_ADDRESS: process.env.NEXT_PUBLIC_CEUR_ADDRESS,
  NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
} as const

// Validate required environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

// Default addresses for development
const DEFAULT_ADDRESSES = {
  SUBPAY: '0x089D37C1Ca872221E37487c1F2D006907561B1fd',
  CUSD: '0x765de816845861e75a25fca122bb6898b8b1282a',
  CEUR: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
} as const

// Export validated environment variables
export const env = {
  // Contract addresses
  SUBPAY_CONTRACT_ADDRESS: getAddress(
    process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS || DEFAULT_ADDRESSES.SUBPAY
  ),
  CUSD_ADDRESS: getAddress(
    process.env.NEXT_PUBLIC_CUSD_ADDRESS || DEFAULT_ADDRESSES.CUSD
  ),
  CEUR_ADDRESS: getAddress(
    process.env.NEXT_PUBLIC_CEUR_ADDRESS || DEFAULT_ADDRESSES.CEUR
  ),
  
  // WalletConnect
  WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '5ff120ed427ab9eac2fae16c8424d45a',
  
  // Environment
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const

// Type for environment variables
export type Env = typeof env

// Log warnings in development
if (env.IS_DEVELOPMENT) {
  if (!process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS) {
    console.warn('Using fallback SubPay contract address for development')
  }
  if (!process.env.NEXT_PUBLIC_CUSD_ADDRESS) {
    console.warn('Using fallback cUSD address for development')
  }
  if (!process.env.NEXT_PUBLIC_CEUR_ADDRESS) {
    console.warn('Using fallback cEUR address for development')
  }
} 