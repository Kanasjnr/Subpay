import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { createWalletClient, custom, type Hash, type Chain } from 'viem';

if (!process.env.NEXT_PUBLIC_DIVVI_CONSUMER) {
  throw new Error('NEXT_PUBLIC_DIVVI_CONSUMER environment variable is not set');
}

if (!process.env.NEXT_PUBLIC_DIVVI_PROVIDERS) {
  throw new Error('NEXT_PUBLIC_DIVVI_PROVIDERS environment variable is not set');
}

const DIVVI_CONSUMER = process.env.NEXT_PUBLIC_DIVVI_CONSUMER as `0x${string}`;
const DIVVI_PROVIDERS = process.env.NEXT_PUBLIC_DIVVI_PROVIDERS.split(',') as `0x${string}`[];

// Optionally, add runtime validation for hex strings
function isHexString(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]+$/.test(value);
}

if (!isHexString(DIVVI_CONSUMER)) {
  throw new Error('DIVVI_CONSUMER must be a valid hex string (0x...)');
}
if (!DIVVI_PROVIDERS.every(isHexString)) {
  throw new Error('All DIVVI_PROVIDERS must be valid hex strings (0x...)');
}

export const getReferralDataSuffix = () => {
  return getDataSuffix({
    consumer: DIVVI_CONSUMER,
    providers: DIVVI_PROVIDERS,
  });
};

export const submitReferralTransaction = async (
  txHash: Hash,
  chain: Chain,
  walletClient: ReturnType<typeof createWalletClient>
) => {
  try {
    const chainId = await walletClient.getChainId();
    await submitReferral({
      txHash,
      chainId,
    });
    console.log('Referral submitted successfully');
  } catch (error) {
    console.error('Error submitting referral:', error);
    throw error;
  }
};

// Helper function to append referral data to any transaction
export const appendReferralData = (data: string) => {
  const dataSuffix = getReferralDataSuffix();
  return data + dataSuffix;
}; 