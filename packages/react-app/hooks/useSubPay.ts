'use client';

import {
  useWriteContract,
  useContractRead,
  useAccount,
  useBalance,
  usePublicClient,
} from 'wagmi';
import {
  type UseWriteContractParameters,
  type UseReadContractParameters,
} from 'wagmi';
import {
  type UseWriteContractReturnType,
  type UseReadContractReturnType,
} from 'wagmi';
import { parseEther } from 'viem';
import { SUBPAY_ABI } from '@/constants/abi';
import { SUBPAY_ADDRESS } from '@/constants/addresses';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { PublicClient } from 'viem';
import { appendReferralData, submitReferralTransaction } from '@/lib/referral';

// Token addresses on Celo
const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD_ADDRESS as `0x${string}`;
const CEUR_ADDRESS = process.env.NEXT_PUBLIC_CEUR_ADDRESS as `0x${string}`;

if (!CUSD_ADDRESS || !CEUR_ADDRESS) {
  throw new Error('Token addresses not found in environment variables');
}

// Define types for contract structures
interface SubscriptionPlan {
  merchant: `0x${string}`;
  paymentToken: `0x${string}`;
  amount: bigint;
  frequency: bigint;
  trialPeriod: bigint;
  active: boolean;
  metadata: string;
}

interface Subscription {
  planId: bigint;
  subscriber: `0x${string}`;
  startTime: bigint;
  nextPaymentTime: bigint;
  lastPaymentTime: bigint;
  active: boolean;
}

interface PaymentRecord {
  timestamp: bigint;
  success: boolean;
  amount: bigint;
  token: `0x${string}`;
  metadata: string;
  subscriptionId: bigint;
  merchant: `0x${string}`;
}

interface Dispute {
  subscriptionId: bigint;
  subscriber: `0x${string}`;
  merchant: `0x${string}`;
  paymentToken: `0x${string}`;
  amount: bigint;
  createdAt: bigint;
  resolvedAt: bigint;
  status: number; // DisputeStatus enum
  resolution: number; // Resolution enum
  reason: string;
  merchantEvidence: string;
  subscriberEvidence: string;
  resolutionNotes: string;
  resolver: `0x${string}`;
  refundAmount: bigint;
}

// Enum types from the contract
enum DisputeStatus {
  None = 0,
  Opened = 1,
  EvidenceSubmitted = 2,
  Resolved = 3,
  Cancelled = 4,
}

enum Resolution {
  None = 0,
  MerchantWins = 1,
  SubscriberWins = 2,
  Compromise = 3,
}

enum RiskLevel {
  High = 0,
  Medium = 1,
  Low = 2,
}

// Define return type for the hook
interface SubPayHook {
  // Token balances
  cUSDBalance: ReturnType<typeof useBalance>['data'];
  cEURBalance: ReturnType<typeof useBalance>['data'];

  // Subscription Management
  createPlan: (
    paymentToken: `0x${string}`,
    amount: string,
    frequency: number,
    trialPeriod: number,
    metadata: string
  ) => Promise<`0x${string}` | undefined>;
  updatePlan: (
    planId: bigint,
    active: boolean,
    amount: string,
    frequency: number
  ) => Promise<`0x${string}` | undefined>;
  subscribe: (planId: bigint) => Promise<`0x${string}` | undefined>;
  cancelSubscription: (
    subscriptionId: bigint
  ) => Promise<`0x${string}` | undefined>;
  processDuePayments: (
    subscriptionIds: bigint[]
  ) => Promise<`0x${string}` | undefined>;

  // Credit Scoring
  getCreditScore: (user: `0x${string}`) => Promise<bigint | undefined>;
  getPaymentHistory: (
    user: `0x${string}`,
    limit: number
  ) => Promise<PaymentRecord[] | undefined>;

  // Payment Prediction
  calculateLikelihood: (
    subscriptionId: bigint
  ) => Promise<{ likelihood: bigint; riskLevel: RiskLevel } | undefined>;
  getPrediction: (
    subscriptionId: bigint
  ) => Promise<
    | {
        likelihood: bigint;
        lastUpdated: bigint;
        factors: string;
        riskLevel: RiskLevel;
      }
    | undefined
  >;
  getHighRiskSubscriptions: (limit: number) => Promise<bigint[] | undefined>;

  // Dispute Resolution
  openDispute: (
    subscriptionId: bigint,
    reason: string
  ) => Promise<`0x${string}` | undefined>;
  submitEvidence: (
    disputeId: bigint,
    evidence: string
  ) => Promise<`0x${string}` | undefined>;
  cancelDispute: (disputeId: bigint) => Promise<`0x${string}` | undefined>;
  getDispute: (disputeId: bigint) => Promise<Dispute | undefined>;
  resolveSubscriptionDispute: (
    disputeId: bigint,
    resolution: number,
    refundAmount: string,
    notes: string
  ) => Promise<`0x${string}` | undefined>;

  // Read data
  merchantPlans: readonly bigint[] | undefined;
  subscriberSubscriptions: readonly bigint[] | undefined;
  getDueSubscriptions: (limit: number) => Promise<bigint[] | undefined>;
  getPlanDetails: (
    planId: bigint,
    skipLogging?: boolean
  ) => Promise<SubscriptionPlan | undefined>;
  getSubscriptionDetails: (
    subscriptionId: bigint
  ) => Promise<Subscription | undefined>;
  getAllPlans: (limit?: number) => Promise<bigint[] | undefined>;
  getAllSubscribers: (limit?: number) => Promise<`0x${string}`[] | undefined>;
  getMerchantSubscribers: (merchantAddress: `0x${string}`) => Promise<`0x${string}`[] | undefined>;

  // Refetch functions
  refetchMerchantPlans: () => Promise<any>;
  refetchSubscriptions: () => Promise<any>;

  // Loading states
  isCreatingPlan: boolean;
  isUpdatingPlan: boolean;
  isSubscribing: boolean;
  isCancelling: boolean;
  isProcessingPayments: boolean;
  isOpeningDispute: boolean;
  isSubmittingEvidence: boolean;
  isCancellingDispute: boolean;
  isApproving: boolean;
  isResolvingDispute: boolean;
  isArbitrator: boolean;
  dispute:
    | [
        bigint, // id
        string, // subscriber
        string, // merchant
        string, // arbitrator
        bigint, // subscriptionId
        bigint, // refundAmount
        bigint, // createdAt
        bigint, // resolvedAt
        number, // resolutionType
        string, // resolutionNotes
        string, // reason
        string, // evidence
        number, // status
        number // resolution
      ]
    | null;

  // New functions
  getEvidence: (disputeId: bigint) => Promise<string>;
}

export function useSubPay(): SubPayHook {
  const { toast } = useToast();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Get token balances
  const { data: cUSDBalance } = useBalance({
    address,
    token: CUSD_ADDRESS as `0x${string}`,
  });

  const { data: cEURBalance } = useBalance({
    address,
    token: CEUR_ADDRESS as `0x${string}`,
  });

  // Contract write functions
  const {
    writeContract: createPlanWrite,
    isPending: isCreatingPlan,
    data: createPlanData,
  } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log('Transaction hash:', hash);
        toast({
          title: 'Success',
          description: 'Plan created successfully',
        });
      },
    },
  });

  const {
    writeContract: updatePlanWrite,
    isPending: isUpdatingPlan,
    data: updatePlanData,
  } = useWriteContract();

  const {
    writeContract: subscribeWrite,
    isPending: isSubscribing,
    data: subscribeData,
  } = useWriteContract();

  // Create a separate useContractWrite hook for token approval
  const {
    writeContract: approveTokenWrite,
    isPending: isApproving,
    data: approveData,
  } = useWriteContract();

  const {
    writeContract: cancelSubscriptionWrite,
    isPending: isCancelling,
    data: cancelData,
  } = useWriteContract();

  const {
    writeContract: processDuePaymentsWrite,
    isPending: isProcessingPayments,
    data: processDuePaymentsData,
  } = useWriteContract();

  const {
    writeContract: openDisputeWrite,
    isPending: isOpeningDispute,
    data: openDisputeData,
  } = useWriteContract();

  const {
    writeContract: submitEvidenceWrite,
    isPending: isSubmittingEvidence,
    data: submitEvidenceData,
  } = useWriteContract();

  const {
    writeContract: cancelDisputeWrite,
    isPending: isCancellingDispute,
    data: cancelDisputeData,
  } = useWriteContract();

  const {
    writeContract: resolveDisputeWrite,
    isPending: isResolvingDispute,
    data: resolveDisputeData,
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Dispute resolved successfully',
        });
      },
      onError: (error) => {
        console.error('Error resolving dispute:', error);
        toast({
          title: 'Error',
          description: 'Failed to resolve dispute',
          variant: 'destructive',
        });
      },
    },
  });

  // Get merchant plans
  const merchantPlansRead = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS,
    functionName: 'getMerchantPlans',
    args: address ? [address] : undefined,
    account: address,
  });

  // Get subscriber subscriptions
  const subscriberSubscriptionsRead = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS,
    functionName: 'getSubscriberSubscriptions',
    args: address ? [address] : undefined,
    account: address,
  });

  // Get isArbitrator
  const isArbitratorRead = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS,
    functionName: 'arbitrators',
    args: address ? [address] : undefined,
    account: address,
  });

  // Get current dispute
  const currentDisputeRead = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS,
    functionName: 'disputes',
    args: address ? [0n] : undefined,
    account: address,
  });

  const merchantPlans = merchantPlansRead.data;
  const subscriberSubscriptions = subscriberSubscriptionsRead.data;
  const isArbitrator = isArbitratorRead.data;
  const currentDispute = currentDisputeRead.data;
  const refetchMerchantPlans = merchantPlansRead.refetch;
  const refetchSubscriptions = subscriberSubscriptionsRead.refetch;

  // Create plan wrapper function
  const createPlan = async (
    paymentToken: `0x${string}`,
    amount: string,
    frequency: number,
    trialPeriod: number,
    metadata: string
  ): Promise<`0x${string}` | undefined> => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Creating plan with params:', {
        paymentToken,
        amount,
        frequency,
        trialPeriod,
        metadata,
      });

      const { request } = await publicClient.simulateContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'createPlan',
        args: [
          paymentToken,
          parseEther(amount),
          BigInt(frequency),
          BigInt(trialPeriod),
          metadata,
        ],
        account: address,
      });

      await createPlanWrite(request);
      await refetchMerchantPlans();

      // Return the SUBPAY_ADDRESS as a fallback since we can't get the hash synchronously
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create plan',
        variant: 'destructive',
      });
    }
  };

  // Update plan wrapper function
  const updatePlan = async (
    planId: bigint,
    active: boolean,
    amount: string,
    frequency: number
  ) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'updatePlan',
        args: [planId, active, parseEther(amount), BigInt(frequency)],
        account: address,
      });

      await updatePlanWrite(request);
      await refetchMerchantPlans();
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update plan',
        variant: 'destructive',
      });
    }
  };

  // Subscribe wrapper function
  const subscribe = async (planId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First get the plan details to know how many tokens to approve
      const plan = await getPlanDetails(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Check current allowance
      const tokenContract = {
        address: plan.paymentToken,
        abi: [
          {
            name: 'allowance',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
            ],
            outputs: [{ type: 'uint256' }],
          },
        ],
      } as const;

      const currentAllowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [address, SUBPAY_ADDRESS],
      });

      // If allowance is insufficient, request approval
      if (currentAllowance < plan.amount) {
        const { request: approveRequest } = await publicClient.simulateContract(
          {
            address: plan.paymentToken,
            abi: [
              {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ type: 'bool' }],
              },
            ],
            functionName: 'approve',
            args: [SUBPAY_ADDRESS, plan.amount],
            account: address,
          }
        );

        await approveTokenWrite(approveRequest);

        // Wait for approval to be confirmed
        toast({
          title: 'Approval Pending',
          description: 'Please approve token spending in your wallet',
        });
      }

      // Now proceed with subscription
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'subscribe',
        args: [planId],
        account: address,
      });

      // Append referral data to the transaction
      const txWithReferral =
        typeof (request as any).data === 'string'
          ? { ...request, data: appendReferralData((request as any).data) }
          : request;

      const txHash = await subscribeWrite(txWithReferral);
      
      // Submit the referral after the transaction is confirmed
      if (txHash != null) {
        try {
          // Defensive checks for config structure
          const chain = (config.state as any)?.chain ?? (config.state as any)?.chainId;
          const connection = (config.state as any)?.connections?.get?.((config.state as any)?.current);
          const walletClient = connection?.walletClient;
          if (chain && walletClient) {
            await submitReferralTransaction(txHash, chain, walletClient);
            console.log('Referral submitted successfully');
          } else {
            console.warn('Could not submit referral: missing chain or walletClient');
          }
        } catch (referralError) {
          console.error('Error submitting referral:', referralError);
          // Don't throw here - we don't want to fail the subscription if referral fails
        }
      }

      await refetchSubscriptions();
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to subscribe',
        variant: 'destructive',
      });
    }
  };

  // Cancel subscription wrapper function
  const cancelSubscription = async (subscriptionId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'cancelSubscription',
        args: [subscriptionId],
        account: address,
      });

      await cancelSubscriptionWrite(request);
      await refetchSubscriptions();
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  // Process due payments wrapper function
  const processDuePayments = async (subscriptionIds: bigint[]) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'processDuePayments',
        args: [subscriptionIds],
        account: address,
      });

      await processDuePaymentsWrite(request);
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error processing payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payments',
        variant: 'destructive',
      });
    }
  };

  // Open dispute wrapper function
  const openDispute = async (subscriptionId: bigint, reason: string) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'openDispute',
        args: [subscriptionId, reason],
        account: address,
      });

      await openDisputeWrite(request);
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error opening dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to open dispute',
        variant: 'destructive',
      });
    }
  };

  // Submit evidence wrapper function
  const submitEvidence = async (disputeId: bigint, evidence: string) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'submitEvidence',
        args: [disputeId, evidence],
        account: address,
      });

      await submitEvidenceWrite(request);
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit evidence',
        variant: 'destructive',
      });
    }
  };

  // Cancel dispute wrapper function
  const cancelDispute = async (disputeId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'cancelDispute',
        args: [disputeId],
        account: address,
      });

      await cancelDisputeWrite(request);
      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error cancelling dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel dispute',
        variant: 'destructive',
      });
    }
  };

  // Get plan details by ID
  const getPlanDetails = async (
    planId: bigint,
    skipLogging = false
  ): Promise<SubscriptionPlan | undefined> => {
    if (!publicClient) return undefined;

    try {
      if (!skipLogging) {
        console.log('Fetching plan details for ID:', planId.toString());
      }

      const result = await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'plans',
        args: [planId],
      });

      if (!skipLogging) {
        console.log('Plan details for ID', planId.toString(), ':', result);
      }

      // Map the array response to an object
      if (Array.isArray(result) && result.length >= 7) {
        const plan = {
          merchant: result[0] as `0x${string}`,
          paymentToken: result[1] as `0x${string}`,
          amount: result[2] as bigint,
          frequency: result[3] as bigint,
          trialPeriod: result[4] as bigint,
          active: result[5] as boolean,
          metadata: result[6] as string,
        };

        // Return undefined for invalid plans
        if (plan.merchant === '0x0000000000000000000000000000000000000000') {
          return undefined;
        }

        return plan;
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      return undefined;
    }
  };

  // Get all available plans
  const getAllPlans = async (limit = 20): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined;

    try {
      console.log('Getting all available plans with limit:', limit);
      const plans: bigint[] = [];
      let foundAny = false;

      // Start from ID 1 and check each plan sequentially
      for (let i = 1; i <= limit; i++) {
        try {
          const planId = BigInt(i);
          const plan = await getPlanDetails(planId, true); // Pass true to skip logging

          if (plan) {
            foundAny = true;
            // If plan exists, is active, and has a valid merchant, add it to the list
            if (
              plan.active &&
              plan.merchant !== '0x0000000000000000000000000000000000000000'
            ) {
              console.log(`Found valid plan ${i}:`, {
                merchant: plan.merchant,
                amount: plan.amount.toString(),
                active: plan.active,
              });
              plans.push(planId);
            } else {
              console.log(`Found inactive/invalid plan ${i}:`, {
                merchant: plan.merchant,
                active: plan.active,
              });
            }
          }
        } catch (error) {
          console.log(`No plan found at ID ${i}`);
          continue;
        }
      }

      if (!foundAny) {
        console.log('No plans found in the first', limit, 'IDs');
      } else {
        console.log(
          `Found ${plans.length} valid plans out of ${limit} checked`
        );
      }

      return plans;
    } catch (error) {
      console.error('Error fetching all plans:', error);
      return undefined;
    }
  };

  // Get subscription details by ID
  const getSubscriptionDetails = async (
    subscriptionId: bigint
  ): Promise<Subscription | undefined> => {
    if (!publicClient) return undefined;

    try {
      const result = await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'subscriptions',
        args: [subscriptionId],
      });

      // Only log if the subscription is active or has a non-zero address
      const isRelevant =
        Array.isArray(result) &&
        result.length >= 6 &&
        (result[5] === true ||
          result[1] !== '0x0000000000000000000000000000000000000000');

      if (isRelevant) {
        console.log(
          'Subscription details for ID',
          subscriptionId.toString(),
          ':',
          result
        );
      }

      // Map the array response to an object
      if (Array.isArray(result) && result.length >= 6) {
        return {
          planId: result[0] as bigint,
          subscriber: result[1] as `0x${string}`,
          startTime: result[2] as bigint,
          nextPaymentTime: result[3] as bigint,
          lastPaymentTime: result[4] as bigint,
          active: result[5] as boolean,
        };
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return undefined;
    }
  };

  // Get due subscriptions
  const getDueSubscriptions = async (
    limit: number
  ): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined;

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getDueSubscriptions',
        args: [BigInt(limit)],
      })) as bigint[];

      return data;
    } catch (error) {
      console.error('Error fetching due subscriptions:', error);
      return undefined;
    }
  };

  // Get credit score for a user
  const getCreditScore = async (
    user: `0x${string}`
  ): Promise<bigint | undefined> => {
    if (!publicClient) return undefined;

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getCreditScore',
        args: [user],
      })) as bigint;

      return data;
    } catch (error) {
      console.error('Error fetching credit score:', error);
      return undefined;
    }
  };

  // Get payment history for a user
  const getPaymentHistory = async (
    user: `0x${string}`,
    limit: number
  ): Promise<PaymentRecord[] | undefined> => {
    if (!publicClient) return undefined;

    try {
      console.log(
        'Fetching payment history for user:',
        user,
        'with limit:',
        limit
      );

      // First try to get payment events from the blockchain
      console.log('Trying to get payment events from blockchain logs...');

      try {
        const currentBlock = await publicClient.getBlockNumber();
        // Look back 5,000,000 blocks (approximately 20 months on Celo)
        const fromBlock = currentBlock - BigInt(5000000);
        console.log(
          `Searching for events from block ${fromBlock} to ${currentBlock}`
        );

        // Get both PaymentProcessed and PaymentRecorded events
        const [processedEvents, recordedEvents] = await Promise.all([
          publicClient.getContractEvents({
            address: SUBPAY_ADDRESS as `0x${string}`,
            abi: SUBPAY_ABI,
            eventName: 'PaymentProcessed',
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getContractEvents({
            address: SUBPAY_ADDRESS as `0x${string}`,
            abi: SUBPAY_ABI,
            eventName: 'PaymentRecorded',
            fromBlock,
            toBlock: 'latest',
          }),
        ]);

        console.log('PaymentProcessed events found:', processedEvents);
        console.log('PaymentRecorded events found:', recordedEvents);
        console.log('Total events found:', processedEvents.length + recordedEvents.length);

       

        // Combine and process both types of events
        const paymentRecords: PaymentRecord[] = [];
        const seenTxHashes = new Set<string>();

        // Process PaymentProcessed events first (these have the correct token address)
        for (const event of processedEvents) {
          const args = event.args as any;
          const txHash = event.transactionHash || 'Unknown';
          
          // Log the event details for debugging
          console.log('Processing PaymentProcessed event:', {
            subscriber: args.subscriber,
            user: user,
            matches: args.subscriber && args.subscriber.toLowerCase() === user.toLowerCase(),
            txHash,
            blockNumber: event.blockNumber
          });

          if (args.subscriber && args.subscriber.toLowerCase() === user.toLowerCase()) {
            if (!seenTxHashes.has(txHash)) {
              seenTxHashes.add(txHash);
              const block = await publicClient.getBlock({
                blockNumber: event.blockNumber,
              });
              console.log('PaymentProcessed event args:', args);
              console.log('Transaction hash:', txHash);
              paymentRecords.push({
                timestamp: block.timestamp,
                success: true,
                amount: args.amount || BigInt(0),
                token: CUSD_ADDRESS as `0x${string}`,
                metadata: txHash,
                subscriptionId: args.subscriptionId,
                merchant: args.merchant,
              });
            }
          }
        }

        // Process PaymentRecorded events (only if we haven't seen the transaction)
        for (const event of recordedEvents) {
          const args = event.args as any;
          const txHash = event.transactionHash || 'Unknown';
          
          // Log the event details for debugging
          console.log('Processing PaymentRecorded event:', {
            user: args.user,
            targetUser: user,
            matches: args.user && args.user.toLowerCase() === user.toLowerCase(),
            txHash,
            blockNumber: event.blockNumber
          });

          if (args.user && args.user.toLowerCase() === user.toLowerCase()) {
            if (!seenTxHashes.has(txHash)) {
              seenTxHashes.add(txHash);
              const block = await publicClient.getBlock({
                blockNumber: event.blockNumber,
              });
              console.log('PaymentRecorded event args:', args);
              console.log('Transaction hash:', txHash);
              paymentRecords.push({
                timestamp: block.timestamp,
                success: args.success || false,
                amount: args.amount || BigInt(0),
                token: args.token || (CUSD_ADDRESS as `0x${string}`),
                metadata: txHash,
                subscriptionId: args.subscriptionId,
                merchant: args.merchant,
              });
            }
          }
        }

        // If we found events, sort and return them
        if (paymentRecords.length > 0) {
          // Sort by timestamp (newest first) and limit
          const sortedRecords = paymentRecords
            .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
            .slice(0, limit);

          console.log('Found payment records from events:', sortedRecords);
          return sortedRecords;
        }
      } catch (eventsError) {
        console.error('Error fetching payment events:', eventsError);
      }

      // Fallback: Try the direct contract call if no events were found
      console.log('No events found, trying contract storage...');
      try {
        const data = await publicClient.readContract({
          address: SUBPAY_ADDRESS as `0x${string}`,
          abi: SUBPAY_ABI,
          functionName: 'getPaymentHistory',
          args: [user, BigInt(limit)],
        });

        console.log('Raw payment history data from contract:', data);

        // If we got data back, process the payment records
        if (Array.isArray(data) && data.length > 0) {
          const paymentRecords = data as PaymentRecord[];
          
          // For each payment, try to find its transaction hash
          for (const payment of paymentRecords) {
            if (!payment.metadata) {
              try {
                // Get the current block number
                const currentBlock = await publicClient.getBlockNumber();
                
                // If the payment timestamp is in the future, we can't find the block
                if (payment.timestamp > BigInt(Math.floor(Date.now() / 1000))) {
                  console.log('Payment timestamp is in the future, skipping block lookup');
                  continue;
                }

                // Calculate approximate block number based on timestamp
                // Celo produces a block every ~5 seconds
                const blocksPerSecond = 0.2; // 1 block per 5 seconds
                const blockNumber = BigInt(Math.floor(Number(payment.timestamp) * blocksPerSecond));
                
                // Ensure block number is within valid range
                if (blockNumber > currentBlock) {
                  console.log('Calculated block number is in the future, skipping');
                  continue;
                }

                // Get the block
                const block = await publicClient.getBlock({
                  blockNumber,
                  includeTransactions: true,
                });

                // Find the transaction that matches this payment
                const matchingTx = block.transactions.find(tx => {
                  if (typeof tx === 'string') return false;
                  return tx.to?.toLowerCase() === SUBPAY_ADDRESS.toLowerCase();
                });

                if (matchingTx && typeof matchingTx !== 'string') {
                  payment.metadata = matchingTx.hash;
                }
              } catch (error) {
                console.error('Error finding transaction hash:', error);
              }
            }
          }

          // Ensure all payment records have a valid metadata field
          return paymentRecords.map(record => ({
            ...record,
            metadata: record.metadata || 'Unknown'
          }));
        }
      } catch (contractError) {
        console.error(
          'Error calling getPaymentHistory contract method:',
          contractError
        );
      }

      // If we reach here, we couldn't get any payment data
      console.log('No payment history found through any method');
      return [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      // Return an empty array instead of undefined to avoid null checks
      return [];
    }
  };

  // Calculate likelihood of successful payment
  const calculateLikelihood = async (
    subscriptionId: bigint
  ): Promise<{ likelihood: bigint; riskLevel: RiskLevel } | undefined> => {
    if (!publicClient) return undefined;

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'calculateLikelihood',
        args: [subscriptionId],
      })) as [bigint, RiskLevel];

      return {
        likelihood: data[0],
        riskLevel: data[1],
      };
    } catch (error) {
      console.error('Error calculating likelihood:', error);
      return undefined;
    }
  };

  // Get payment prediction
  const getPrediction = async (
    subscriptionId: bigint
  ): Promise<
    | {
        likelihood: bigint;
        lastUpdated: bigint;
        factors: string;
        riskLevel: RiskLevel;
      }
    | undefined
  > => {
    if (!publicClient) return undefined;

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getPrediction',
        args: [subscriptionId],
      })) as [bigint, bigint, string, RiskLevel];

      return {
        likelihood: data[0],
        lastUpdated: data[1],
        factors: data[2],
        riskLevel: data[3],
      };
    } catch (error) {
      console.error('Error getting prediction:', error);
      return undefined;
    }
  };

  // Get high risk subscriptions
  const getHighRiskSubscriptions = async (
    limit: number
  ): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined;
    try {
      const result = await publicClient.readContract({
        address: SUBPAY_ADDRESS,
        abi: SUBPAY_ABI,
        functionName: 'getHighRiskSubscriptions',
        args: [BigInt(limit)],
      });
      return result as bigint[];
    } catch (error) {
      console.error('Error getting high risk subscriptions:', error);
      return undefined;
    }
  };

  const getAllSubscribers = async (limit = 100): Promise<`0x${string}`[] | undefined> => {
    if (!publicClient || !address) return undefined;
    const client = publicClient as PublicClient;
    try {
      // First get all subscription IDs for the merchant
      const merchantSubscriptions = await client.readContract({
        address: SUBPAY_ADDRESS,
        abi: SUBPAY_ABI,
        functionName: 'getMerchantPlans',
        args: [address as `0x${string}`],
      }) as bigint[];

      console.log('Merchant plans:', merchantSubscriptions);

      // Get subscription details for each plan to find subscribers
      const subscribers = new Set<`0x${string}`>();
      
      // For each plan, get all subscriptions
      for (const planId of merchantSubscriptions) {
        try {
          // Get subscription details for this plan
          const subscription = await client.readContract({
            address: SUBPAY_ADDRESS,
            abi: SUBPAY_ABI,
            functionName: 'subscriptions',
            args: [planId],
          }) as [bigint, `0x${string}`, bigint, bigint, bigint, boolean];

          console.log(`Subscription for plan ${planId}:`, subscription);

          // If the subscription is active and has a valid subscriber, add it to the set
          if (subscription[5] && subscription[1] !== '0x0000000000000000000000000000000000000000') {
            subscribers.add(subscription[1]);
          }
        } catch (error) {
          console.error(`Error fetching subscription for plan ${planId}:`, error);
          continue;
        }
      }

      return Array.from(subscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return undefined;
    }
  };

  // Get dispute details
  const getDispute = async (
    disputeId: bigint
  ): Promise<Dispute | undefined> => {
    if (!publicClient) return undefined;

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: 'getDispute',
        args: [disputeId],
      })) as Dispute;

      // Check if the dispute exists by checking if all fields are default values
      if (
        data.subscriptionId === 0n &&
        data.subscriber === '0x0000000000000000000000000000000000000000' &&
        data.merchant === '0x0000000000000000000000000000000000000000' &&
        data.paymentToken === '0x0000000000000000000000000000000000000000' &&
        data.amount === 0n &&
        data.createdAt === 0n &&
        data.resolvedAt === 0n &&
        data.status === 0 &&
        data.resolution === 0 &&
        data.reason === '' &&
        data.merchantEvidence === '' &&
        data.subscriberEvidence === '' &&
        data.resolutionNotes === '' &&
        data.resolver === '0x0000000000000000000000000000000000000000' &&
        data.refundAmount === 0n
      ) {
        return undefined;
      }

      return data;
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      return undefined;
    }
  };

  // Resolve dispute function
  const resolveSubscriptionDispute = async (
    disputeId: bigint,
    resolution: number,
    refundAmount: string,
    notes: string
  ): Promise<`0x${string}` | undefined> => {
    if (!address || !publicClient) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: 'resolveDispute',
        args: [disputeId, resolution, parseEther(refundAmount), notes],
        account: address,
      });

      await resolveDisputeWrite(request);

      toast({
        title: 'Success',
        description: 'Dispute resolved successfully',
      });

      return SUBPAY_ADDRESS;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve dispute',
        variant: 'destructive',
      });
    }
  };

  const getMerchantSubscribers = async (merchantAddress: `0x${string}`): Promise<`0x${string}`[] | undefined> => {
    if (!publicClient) return undefined;
    const client = publicClient as PublicClient;
    try {
      // First get all subscription IDs for the merchant
      const merchantSubscriptions = await client.readContract({
        address: SUBPAY_ADDRESS,
        abi: SUBPAY_ABI,
        functionName: 'getMerchantPlans',
        args: [merchantAddress],
      }) as bigint[];

      console.log('Merchant plans:', merchantSubscriptions);

      // Get subscription details for each plan to find subscribers
      const subscribers = new Set<`0x${string}`>();
      
      // For each plan, get all subscriptions
      for (const planId of merchantSubscriptions) {
        try {
          // Get subscription details for this plan
          const subscription = await client.readContract({
            address: SUBPAY_ADDRESS,
            abi: SUBPAY_ABI,
            functionName: 'subscriptions',
            args: [planId],
          }) as [bigint, `0x${string}`, bigint, bigint, bigint, boolean];

          console.log(`Subscription for plan ${planId}:`, subscription);

          // If the subscription is active and has a valid subscriber, add it to the set
          if (subscription[5] && subscription[1] !== '0x0000000000000000000000000000000000000000') {
            subscribers.add(subscription[1]);
          }
        } catch (error) {
          console.error(`Error fetching subscription for plan ${planId}:`, error);
          continue;
        }
      }

      return Array.from(subscribers);
    } catch (error) {
      console.error('Error fetching merchant subscribers:', error);
      return undefined;
    }
  };

  const getEvidence = async (disputeId: bigint): Promise<string> => {
    if (!publicClient) throw new Error('Please connect your wallet first');

    try {
      const dispute = await getDispute(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }
      return dispute.subscriberEvidence;
    } catch (error) {
      console.error('Error fetching evidence:', error);
      throw error;
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Add getAllPlans to the return object in the hook's return statement
  return {
    // Token balances
    cUSDBalance,
    cEURBalance,

    // Subscription Management
    createPlan,
    updatePlan,
    subscribe,
    cancelSubscription,
    processDuePayments,

    // Credit Scoring
    getCreditScore,
    getPaymentHistory,

    // Payment Prediction
    calculateLikelihood,
    getPrediction,
    getHighRiskSubscriptions,

    // Dispute Resolution
    openDispute,
    submitEvidence,
    cancelDispute,
    getDispute,
    resolveSubscriptionDispute,

    // Read data
    merchantPlans,
    subscriberSubscriptions,
    getDueSubscriptions,
    getPlanDetails,
    getSubscriptionDetails,
    getAllPlans,
    getAllSubscribers,
    getMerchantSubscribers,

    // Refetch functions
    refetchMerchantPlans,
    refetchSubscriptions,

    // Loading states
    isCreatingPlan,
    isUpdatingPlan,
    isSubscribing,
    isCancelling,
    isProcessingPayments,
    isOpeningDispute,
    isSubmittingEvidence,
    isCancellingDispute,
    isApproving,
    isResolvingDispute,
    isArbitrator: isArbitrator || false,
    dispute: currentDispute
      ? ([
          currentDispute[0], // id
          currentDispute[1] as string, // subscriber
          currentDispute[2] as string, // merchant
          currentDispute[3] as string, // arbitrator
          currentDispute[4], // subscriptionId
          currentDispute[5], // refundAmount
          currentDispute[6], // createdAt
          BigInt(currentDispute[7]), // resolvedAt
          Number(currentDispute[8]), // resolutionType
          currentDispute[9] as string, // resolutionNotes
          currentDispute[10] as string, // reason
          currentDispute[11] as string, // evidence
          Number(currentDispute[12]), // status
          Number(currentDispute[13]), // resolution
        ] as [
          bigint,
          string,
          string,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          number,
          string,
          string,
          string,
          number,
          number
        ])
      : null,

    // New functions
    getEvidence,
  };
}