import { SUBPAY_ABI } from '@/constants/abi';
import { SUBPAY_ADDRESS } from '@/constants/addresses';

export const disputeContract = {
  address: SUBPAY_ADDRESS,
  abi: SUBPAY_ABI,
} as const; 