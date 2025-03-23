// Get the contract address from environment variables
export const SUBPAY_ADDRESS = process.env.NEXT_PUBLIC_SUBPAY_CONTRACT_ADDRESS as `0x${string}`

if (!SUBPAY_ADDRESS) {
  throw new Error('SUBPAY_CONTRACT_ADDRESS not found in environment variables')
} 