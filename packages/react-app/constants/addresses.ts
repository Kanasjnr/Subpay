// Default addresses (fallbacks)
const DEFAULT_ADDRESSES = {
  SUBPAY: '0x089D37C1Ca872221E37487c1F2D006907561B1fd',
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  CEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
} as const

// Helper function to validate address
const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Helper function to get address with validation
const getAddress = (envVar: string | undefined, defaultValue: string): `0x${string}` => {
  const address = envVar || defaultValue
  if (!isValidAddress(address)) {
    console.warn(`Invalid address format for ${address}, using default`)
    return defaultValue as `0x${string}`
  }
  return address as `0x${string}`
}

// Contract addresses
export const SUBPAY_ADDRESS = getAddress(
  process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS,
  DEFAULT_ADDRESSES.SUBPAY
)

export const CUSD_ADDRESS = getAddress(
  process.env.NEXT_PUBLIC_CUSD_ADDRESS,
  DEFAULT_ADDRESSES.CUSD
)

export const CEUR_ADDRESS = getAddress(
  process.env.NEXT_PUBLIC_CEUR_ADDRESS,
  DEFAULT_ADDRESSES.CEUR
)

// For backward compatibility
export const SUBPAY_CONTRACT_ADDRESS = SUBPAY_ADDRESS
export const CUSD_CONTRACT_ADDRESS = CUSD_ADDRESS
export const CEUR_CONTRACT_ADDRESS = CEUR_ADDRESS

// Log warning in development if using fallback values
if (process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS) {
    console.warn('NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS not found in environment variables, using fallback address')
  }
  if (!process.env.NEXT_PUBLIC_CUSD_ADDRESS) {
    console.warn('NEXT_PUBLIC_CUSD_ADDRESS not found in environment variables, using fallback address')
  }
  if (!process.env.NEXT_PUBLIC_CEUR_ADDRESS) {
    console.warn('NEXT_PUBLIC_CEUR_ADDRESS not found in environment variables, using fallback address')
  }
} 