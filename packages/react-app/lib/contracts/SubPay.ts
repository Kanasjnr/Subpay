import { PublicClient } from 'viem'
import { SUBPAY_ABI } from '@/constants/abi'
import { SUBPAY_CONTRACT_ADDRESS } from '@/constants/contract'

// Define types for contract return values
type SubscriptionTuple = readonly [bigint, `0x${string}`, bigint, bigint, bigint, boolean]
type DisputeTuple = readonly [bigint, `0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint, number, number, string, string, string, string, `0x${string}`, bigint]

type Subscription = {
  planId: bigint
  subscriber: `0x${string}`
  startTime: bigint
  nextPaymentTime: bigint
  lastPaymentTime: bigint
  active: boolean
}

type Dispute = {
  subscriptionId: bigint
  subscriber: `0x${string}`
  merchant: `0x${string}`
  paymentToken: `0x${string}`
  amount: bigint
  createdAt: bigint
  resolvedAt: bigint
  status: number
  resolution: number
  reason: string
  merchantEvidence: string
  subscriberEvidence: string
  resolutionNotes: string
  resolver: `0x${string}`
  refundAmount: bigint
}

// Helper functions to convert tuples to objects
function convertSubscriptionTuple(tuple: SubscriptionTuple): Subscription {
  return {
    planId: tuple[0],
    subscriber: tuple[1],
    startTime: tuple[2],
    nextPaymentTime: tuple[3],
    lastPaymentTime: tuple[4],
    active: tuple[5],
  }
}

function convertDisputeTuple(tuple: DisputeTuple): Dispute {
  return {
    subscriptionId: tuple[0],
    subscriber: tuple[1],
    merchant: tuple[2],
    paymentToken: tuple[3],
    amount: tuple[4],
    createdAt: tuple[5],
    resolvedAt: tuple[6],
    status: tuple[7],
    resolution: tuple[8],
    reason: tuple[9],
    merchantEvidence: tuple[10],
    subscriberEvidence: tuple[11],
    resolutionNotes: tuple[12],
    resolver: tuple[13],
    refundAmount: tuple[14],
  }
}

export class SubPay {
  private publicClient: PublicClient

  constructor(publicClient: PublicClient) {
    this.publicClient = publicClient
  }

  async getMerchantPlans(address: `0x${string}`): Promise<bigint[]> {
    try {
      console.log('Getting merchant plans for address:', address);
      const result = await this.publicClient.readContract({
        address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getMerchantPlans',
        args: [address],
      });

      console.log('Raw merchant plans result:', result);

      // Convert to bigints and filter out any invalid values
      if (Array.isArray(result)) {
        const plans = result
          .map((id: any) => {
            try {
              return BigInt(id.toString());
            } catch (error) {
              console.error('Error converting plan ID to bigint:', error);
              return null;
            }
          })
          .filter((id): id is bigint => id !== null);

        console.log('Processed merchant plans:', plans);
        return plans;
      }

      console.log('No merchant plans found or invalid response format');
      return [];
    } catch (error) {
      console.error('Error getting merchant plans:', error);
      return [];
    }
  }

  async getSubscriberSubscriptions(address: `0x${string}`): Promise<bigint[]> {
    try {
      const result = await this.publicClient.readContract({
        address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getSubscriberSubscriptions',
        args: [address],
      })

      // Convert to bigints
      return Array.isArray(result) ? result.map((id: any) => BigInt(id.toString())) : []
    } catch (error) {
      console.error('Error getting subscriber subscriptions:', error)
      return []
    }
  }

  async getActiveSubscriptions(address: `0x${string}`): Promise<bigint[]> {
    try {
      // Get all subscriptions
      const subscriptionIds = await this.getSubscriberSubscriptions(address)
      const activeSubscriptions: bigint[] = []

      // Check each subscription's status
      for (const subscriptionId of subscriptionIds) {
        try {
          const subscriptionTuple = await this.publicClient.readContract({
            address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
            abi: SUBPAY_ABI,
            functionName: 'subscriptions',
            args: [subscriptionId],
          }) as SubscriptionTuple

          const subscription = convertSubscriptionTuple(subscriptionTuple)
          if (subscription.active) {
            activeSubscriptions.push(subscriptionId)
          }
        } catch (error) {
          console.error(`Error checking subscription ${subscriptionId}:`, error)
          continue
        }
      }

      return activeSubscriptions
    } catch (error) {
      console.error('Error getting active subscriptions:', error)
      return []
    }
  }

  async getSubscriptionData(address: `0x${string}`) {
    try {
      // Get active subscriptions
      const subscriptionIds = await this.getActiveSubscriptions(address)
      
      let cancellations = 0
      let disputes = 0
      let failedPayments = 0

      // Get payment history
      const paymentHistory = await this.publicClient.readContract({
        address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getPaymentHistory',
        args: [address, 100n],
      })
      
      // Count failed payments
      for (const payment of paymentHistory) {
        if (!payment.success) {
          failedPayments++
        }
      }

      // Count disputes and cancellations
      for (const subscriptionId of subscriptionIds) {
        try {
          // Get dispute status
          const disputeTuple = await this.publicClient.readContract({
            address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
            abi: SUBPAY_ABI,
            functionName: 'disputes',
            args: [subscriptionId],
          }) as DisputeTuple

          const dispute = convertDisputeTuple(disputeTuple)
          if (dispute.status > 0) { // If dispute exists
            disputes++
          }

          // Get subscription status
          const subscriptionTuple = await this.publicClient.readContract({
            address: SUBPAY_CONTRACT_ADDRESS as `0x${string}`,
            abi: SUBPAY_ABI,
            functionName: 'subscriptions',
            args: [subscriptionId],
          }) as SubscriptionTuple

          const subscription = convertSubscriptionTuple(subscriptionTuple)
          if (!subscription.active) {
            cancellations++
          }
        } catch (error) {
          console.error(`Error processing subscription ${subscriptionId}:`, error)
          continue
        }
      }

      return {
        cancellations,
        disputes,
        failedPayments
      }
    } catch (error) {
      console.error('Error getting subscription data:', error)
      // Return default values in case of error
      return {
        cancellations: 0,
        disputes: 0,
        failedPayments: 0
      }
    }
  }
} 