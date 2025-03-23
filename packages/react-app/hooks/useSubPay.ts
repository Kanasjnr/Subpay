"use client"

import { useContractWrite, useContractRead, useAccount, useBalance, usePublicClient, useConfig } from "wagmi"
import { parseEther } from "viem"
import { SUBPAY_ABI } from "@/constants/abi"
import { SUBPAY_ADDRESS } from "@/constants/addresses"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

// Token addresses on Celo
const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const CEUR_ADDRESS = "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F"

// Define types for contract structures
interface SubscriptionPlan {
  merchant: `0x${string}`
  paymentToken: `0x${string}`
  amount: bigint
  frequency: bigint
  trialPeriod: bigint
  active: boolean
  metadata: string
}

interface Subscription {
  planId: bigint
  subscriber: `0x${string}`
  startTime: bigint
  nextPaymentTime: bigint
  lastPaymentTime: bigint
  active: boolean
}

interface PaymentRecord {
  timestamp: bigint
  success: boolean
  amount: bigint
  token: `0x${string}`
  metadata: string
}

interface Dispute {
  subscriptionId: bigint
  subscriber: `0x${string}`
  merchant: `0x${string}`
  paymentToken: `0x${string}`
  amount: bigint
  createdAt: bigint
  resolvedAt: bigint
  status: number // DisputeStatus enum
  resolution: number // Resolution enum
  reason: string
  merchantEvidence: string
  subscriberEvidence: string
  resolutionNotes: string
  resolver: `0x${string}`
  refundAmount: bigint
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
  cUSDBalance: ReturnType<typeof useBalance>["data"]
  cEURBalance: ReturnType<typeof useBalance>["data"]

  // Subscription Management
  createPlan: (
    paymentToken: `0x${string}`,
    amount: string,
    frequency: number,
    trialPeriod: number,
    metadata: string,
  ) => Promise<`0x${string}` | undefined>
  updatePlan: (planId: bigint, active: boolean, amount: string, frequency: number) => Promise<`0x${string}` | undefined>
  subscribe: (planId: bigint) => Promise<`0x${string}` | undefined>
  cancelSubscription: (subscriptionId: bigint) => Promise<`0x${string}` | undefined>
  processDuePayments: (subscriptionIds: bigint[]) => Promise<`0x${string}` | undefined>

  // Credit Scoring
  getCreditScore: (user: `0x${string}`) => Promise<bigint | undefined>
  getPaymentHistory: (user: `0x${string}`, limit: number) => Promise<PaymentRecord[] | undefined>

  // Payment Prediction
  calculateLikelihood: (subscriptionId: bigint) => Promise<{ likelihood: bigint; riskLevel: RiskLevel } | undefined>
  getPrediction: (
    subscriptionId: bigint,
  ) => Promise<{ likelihood: bigint; lastUpdated: bigint; factors: string; riskLevel: RiskLevel } | undefined>
  getHighRiskSubscriptions: (limit: number) => Promise<bigint[] | undefined>

  // Dispute Resolution
  openDispute: (subscriptionId: bigint, reason: string) => Promise<`0x${string}` | undefined>
  submitEvidence: (disputeId: bigint, evidence: string) => Promise<`0x${string}` | undefined>
  cancelDispute: (disputeId: bigint) => Promise<`0x${string}` | undefined>
  getDispute: (disputeId: bigint) => Promise<Dispute | undefined>

  // Read data
  merchantPlans: readonly bigint[] | undefined
  subscriberSubscriptions: readonly bigint[] | undefined
  getDueSubscriptions: (limit: number) => Promise<bigint[] | undefined>
  getPlanDetails: (planId: bigint) => Promise<SubscriptionPlan | undefined>
  getSubscriptionDetails: (subscriptionId: bigint) => Promise<Subscription | undefined>
  getAllPlans: (limit?: number) => Promise<bigint[] | undefined>

  // Refetch functions
  refetchMerchantPlans: () => Promise<any>
  refetchSubscriptions: () => Promise<any>

  // Loading states
  isCreatingPlan: boolean
  isUpdatingPlan: boolean
  isSubscribing: boolean
  isCancelling: boolean
  isProcessingPayments: boolean
  isOpeningDispute: boolean
  isSubmittingEvidence: boolean
  isCancellingDispute: boolean
  isApproving: boolean
}

export function useSubPay(): SubPayHook {
  const { toast } = useToast()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const config = useConfig()

  // Get token balances
  const { data: cUSDBalance } = useBalance({
    address,
    token: CUSD_ADDRESS as `0x${string}`,
  })

  const { data: cEURBalance } = useBalance({
    address,
    token: CEUR_ADDRESS as `0x${string}`,
  })

  // Contract write functions
  const {
    writeContract: createPlanWrite,
    isPending: isCreatingPlan,
    data: createPlanData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "createPlan",
  })

  const {
    writeContract: updatePlanWrite,
    isPending: isUpdatingPlan,
    data: updatePlanData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "updatePlan",
  })

  const {
    writeContract: subscribeWrite,
    isPending: isSubscribing,
    data: subscribeData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "subscribe",
  })

  // Create a separate useContractWrite hook for token approval
  const {
    writeContract: approveTokenWrite,
    isPending: isApproving,
    data: approveData,
  } = useContractWrite({
    // We'll set these dynamically when calling the function
    abi: [
      {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "approve",
  })

  const {
    writeContract: cancelSubscriptionWrite,
    isPending: isCancelling,
    data: cancelData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "cancelSubscription",
  })

  const {
    writeContract: processDuePaymentsWrite,
    isPending: isProcessingPayments,
    data: processDuePaymentsData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "processDuePayments",
  })

  const {
    writeContract: openDisputeWrite,
    isPending: isOpeningDispute,
    data: openDisputeData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "openDispute",
  })

  const {
    writeContract: submitEvidenceWrite,
    isPending: isSubmittingEvidence,
    data: submitEvidenceData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "submitEvidence",
  })

  const {
    writeContract: cancelDisputeWrite,
    isPending: isCancellingDispute,
    data: cancelDisputeData,
  } = useContractWrite({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "cancelDispute",
  })

  // Get merchant plans
  const { data: merchantPlans, refetch: refetchMerchantPlans } = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "getMerchantPlans",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      select: (data: any) => data as readonly bigint[],
    },
  })

  // Get subscriber subscriptions
  const { data: subscriberSubscriptions, refetch: refetchSubscriptions } = useContractRead({
    abi: SUBPAY_ABI,
    address: SUBPAY_ADDRESS as `0x${string}`,
    functionName: "getSubscriberSubscriptions",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      select: (data: any) => data as readonly bigint[],
    },
  })

  // Create plan wrapper function
  const createPlan = async (
    paymentToken: `0x${string}`,
    amount: string,
    frequency: number,
    trialPeriod: number,
    metadata: string,
  ) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "createPlan",
        args: [paymentToken, parseEther(amount), BigInt(frequency), BigInt(trialPeriod), metadata],
        account: address,
      })

      const result = await createPlanWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })
        await refetchMerchantPlans()

        toast({
          title: "Success",
          description: "Plan created successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      toast({
        title: "Error",
        description: "Failed to create plan",
        variant: "destructive",
      })
    }
  }

  // Update plan wrapper function
  const updatePlan = async (planId: bigint, active: boolean, amount: string, frequency: number) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "updatePlan",
        args: [planId, active, parseEther(amount), BigInt(frequency)],
        account: address,
      })

      const result = await updatePlanWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })
        await refetchMerchantPlans()

        toast({
          title: "Success",
          description: "Plan updated successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error updating plan:", error)
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      })
    }
  }

  // Updated subscribe function with fixes for token approval and CUSD deduction
  const subscribe = async (planId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      // First, get the plan details to know how much to approve
      const plan = await getPlanDetails(planId)
      if (!plan) {
        toast({
          title: "Error",
          description: "Plan not found",
          variant: "destructive",
        })
        return
      }

      console.log("Plan details:", plan)
      console.log("Plan amount:", plan.amount.toString())
      console.log("Payment token:", plan.paymentToken)

      // Verify we're using the correct token (CUSD)
      if (plan.paymentToken.toLowerCase() !== CUSD_ADDRESS.toLowerCase()) {
        console.warn("Warning: Plan is not using CUSD token. Token address:", plan.paymentToken)
      }

      // Check current allowance
      const allowance = (await publicClient.readContract({
        address: plan.paymentToken,
        abi: [
          {
            name: "allowance",
            type: "function",
            stateMutability: "view",
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "allowance",
        args: [address, SUBPAY_ADDRESS],
      })) as bigint

      console.log("Current allowance:", allowance.toString())
      console.log("Required amount:", plan.amount.toString())

      // If allowance is less than the plan amount, request approval
      if (allowance < plan.amount) {
        toast({
          title: "Approval Required",
          description: `Please approve ${plan.paymentToken === CUSD_ADDRESS ? "CUSD" : "token"} spending before subscribing`,
        })

        // Request approval for the exact amount needed plus some buffer (2x)
        // This ensures we approve enough but not excessively
        const approvalAmount = plan.amount * BigInt(2)

        console.log("Approving amount:", approvalAmount.toString())
        console.log("Token address:", plan.paymentToken)
        console.log("SUBPAY_ADDRESS:", SUBPAY_ADDRESS)

        // Request approval
        const { request: approveRequest } = await publicClient.simulateContract({
          address: plan.paymentToken,
          abi: [
            {
              name: "approve",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [SUBPAY_ADDRESS, approvalAmount],
          account: address,
        })

        // Use the approveTokenWrite hook with the token address
        const approveHash = await approveTokenWrite({
          ...approveRequest,
          address: plan.paymentToken,
        })

        if (!approveHash) {
          toast({
            title: "Error",
            description: "Failed to approve token spending",
            variant: "destructive",
          })
          return
        }

        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log("Approval transaction receipt:", approveReceipt)

        // Verify the new allowance after approval
        const newAllowance = (await publicClient.readContract({
          address: plan.paymentToken,
          abi: [
            {
              name: "allowance",
              type: "function",
              stateMutability: "view",
              inputs: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
              ],
              outputs: [{ name: "", type: "uint256" }],
            },
          ],
          functionName: "allowance",
          args: [address, SUBPAY_ADDRESS],
        })) as bigint

        console.log("New allowance after approval:", newAllowance.toString())

        if (newAllowance < plan.amount) {
          toast({
            title: "Error",
            description: "Approval was not successful. Please try again.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "Token spending approved",
        })
      }

      // Now proceed with the subscription
      console.log("Proceeding with subscription to plan ID:", planId.toString())

      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "subscribe",
        args: [planId],
        account: address,
      })

      const result = await subscribeWrite(request)

      if (result) {
        const hash = result
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.log("Subscription transaction receipt:", receipt)

        await refetchSubscriptions()

        // Also refetch merchant plans to update the business side
        await refetchMerchantPlans()

        toast({
          title: "Success",
          description: "Subscribed successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error subscribing:", error)
      toast({
        title: "Error",
        description: "Failed to subscribe: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      })
    }
  }

  // Cancel subscription wrapper function
  const cancelSubscription = async (subscriptionId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "cancelSubscription",
        args: [subscriptionId],
        account: address,
      })

      const result = await cancelSubscriptionWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })
        await refetchSubscriptions()
        // Also refetch merchant plans to update the business side
        await refetchMerchantPlans()

        toast({
          title: "Success",
          description: "Subscription cancelled successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  // Process due payments wrapper function
  const processDuePayments = async (subscriptionIds: bigint[]) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "processDuePayments",
        args: [subscriptionIds],
        account: address,
      })

      const result = await processDuePaymentsWrite(request)

      if (result) {
        const hash = result
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        console.log("Process payments transaction receipt:", receipt)

        // Refetch data to update UI
        await refetchSubscriptions()
        await refetchMerchantPlans()

        toast({
          title: "Success",
          description: "Payments processed successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error processing payments:", error)
      toast({
        title: "Error",
        description: "Failed to process payments: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      })
    }
  }

  // Open dispute wrapper function
  const openDispute = async (subscriptionId: bigint, reason: string) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "openDispute",
        args: [subscriptionId, reason],
        account: address,
      })

      const result = await openDisputeWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })

        toast({
          title: "Success",
          description: "Dispute opened successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error opening dispute:", error)
      toast({
        title: "Error",
        description: "Failed to open dispute",
        variant: "destructive",
      })
    }
  }

  // Submit evidence wrapper function
  const submitEvidence = async (disputeId: bigint, evidence: string) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "submitEvidence",
        args: [disputeId, evidence],
        account: address,
      })

      const result = await submitEvidenceWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })

        toast({
          title: "Success",
          description: "Evidence submitted successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error submitting evidence:", error)
      toast({
        title: "Error",
        description: "Failed to submit evidence",
        variant: "destructive",
      })
    }
  }

  // Cancel dispute wrapper function
  const cancelDispute = async (disputeId: bigint) => {
    if (!address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const { request } = await publicClient.simulateContract({
        abi: SUBPAY_ABI,
        address: SUBPAY_ADDRESS as `0x${string}`,
        functionName: "cancelDispute",
        args: [disputeId],
        account: address,
      })

      const result = await cancelDisputeWrite(request)

      if (result) {
        const hash = result
        await publicClient.waitForTransactionReceipt({ hash })

        toast({
          title: "Success",
          description: "Dispute cancelled successfully",
        })

        return hash
      }
    } catch (error) {
      console.error("Error cancelling dispute:", error)
      toast({
        title: "Error",
        description: "Failed to cancel dispute",
        variant: "destructive",
      })
    }
  }

  // Get plan details by ID
  const getPlanDetails = async (planId: bigint): Promise<SubscriptionPlan | undefined> => {
    if (!publicClient) return undefined

    try {
      console.log("Fetching plan details for ID:", planId.toString())
      const result = await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "plans",
        args: [planId],
      })

      console.log("Plan details for ID", planId.toString(), ":", result)

      // Map the array response to an object
      if (Array.isArray(result) && result.length >= 7) {
        return {
          merchant: result[0] as `0x${string}`,
          paymentToken: result[1] as `0x${string}`,
          amount: result[2] as bigint,
          frequency: result[3] as bigint,
          trialPeriod: result[4] as bigint,
          active: result[5] as boolean,
          metadata: result[6] as string,
        }
      }

      return undefined
    } catch (error) {
      console.error("Error fetching plan details:", error)
      return undefined
    }
  }

  // Add a function to get all available plans for subscribers by checking plan IDs sequentially
  const getAllPlans = async (limit = 100): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined

    try {
      console.log("Getting all available plans with limit:", limit)

      // We'll try to find plans by checking IDs sequentially
      const plans: bigint[] = []

      // Start from ID 1 and check each plan
      for (let i = 1; i <= limit; i++) {
        try {
          const planId = BigInt(i)
          const plan = await getPlanDetails(planId)

          // If plan exists and is active, add it to the list
          if (plan && plan.active) {
            plans.push(planId)
          }
        } catch (error) {
          // If we get an error for this ID, just continue to the next one
          console.log(`No plan found for ID ${i}, continuing...`)
        }
      }

      console.log("Found plans:", plans)
      return plans
    } catch (error) {
      console.error("Error getting all plans:", error)
      return undefined
    }
  }

  // Get subscription details by ID
  const getSubscriptionDetails = async (subscriptionId: bigint): Promise<Subscription | undefined> => {
    if (!publicClient) return undefined

    try {
      const result = await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "subscriptions",
        args: [subscriptionId],
      })

      // Only log if the subscription is active or has a non-zero address
      const isRelevant =
        Array.isArray(result) &&
        result.length >= 6 &&
        (result[5] === true || result[1] !== "0x0000000000000000000000000000000000000000")

      if (isRelevant) {
        console.log("Subscription details for ID", subscriptionId.toString(), ":", result)
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
        }
      }

      return undefined
    } catch (error) {
      console.error("Error fetching subscription details:", error)
      return undefined
    }
  }

  // Get due subscriptions
  const getDueSubscriptions = async (limit: number): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "getDueSubscriptions",
        args: [BigInt(limit)],
      })) as bigint[]

      return data
    } catch (error) {
      console.error("Error fetching due subscriptions:", error)
      return undefined
    }
  }

  // Get credit score for a user
  const getCreditScore = async (user: `0x${string}`): Promise<bigint | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "getCreditScore",
        args: [user],
      })) as bigint

      return data
    } catch (error) {
      console.error("Error fetching credit score:", error)
      return undefined
    }
  }

  // Replace the getPaymentHistory function with this improved version
  // Get payment history for a user
  const getPaymentHistory = async (user: `0x${string}`, limit: number): Promise<PaymentRecord[] | undefined> => {
    if (!publicClient) return undefined

    try {
      console.log("Fetching payment history for user:", user, "with limit:", limit)

      // First try the direct contract call
      try {
        const data = await publicClient.readContract({
          address: SUBPAY_ADDRESS as `0x${string}`,
          abi: SUBPAY_ABI,
          functionName: "getPaymentHistory",
          args: [user, BigInt(limit)],
        })

        console.log("Raw payment history data from contract:", data)

        // If we got data back, return it
        if (Array.isArray(data) && data.length > 0) {
          return data as PaymentRecord[]
        }
      } catch (contractError) {
        console.error("Error calling getPaymentHistory contract method:", contractError)
        // Continue to fallback method
      }

      // Fallback: Try to get payment events from the blockchain
      console.log("Trying to get payment events from blockchain logs...")

      try {
        // Look for PaymentProcessed events in the last 10000 blocks
        const events = await publicClient.getContractEvents({
          address: SUBPAY_ADDRESS as `0x${string}`,
          abi: SUBPAY_ABI,
          eventName: "PaymentProcessed",
          fromBlock: BigInt(await publicClient.getBlockNumber()) - BigInt(10000),
          toBlock: "latest",
        })

        console.log("Payment events found:", events)

        if (events && events.length > 0) {
          // Convert events to PaymentRecord format
          const paymentRecords: PaymentRecord[] = events
            .filter((event) => {
              // Filter events for this user
              const args = event.args as any
              return args.subscriber && args.subscriber.toLowerCase() === user.toLowerCase()
            })
            .map((event) => {
              const args = event.args as any
              return {
                timestamp: BigInt(event.blockNumber || 0),
                success: true, // If the event was emitted, the payment was successful
                amount: args.amount || BigInt(0),
                token: args.token || "0x0000000000000000000000000000000000000000",
                metadata: args.metadata || `Transaction: ${event.transactionHash}`,
              }
            })
            .slice(0, limit)

          console.log("Converted payment records:", paymentRecords)
          return paymentRecords
        }
      } catch (eventsError) {
        console.error("Error fetching payment events:", eventsError)
      }

      // If we reach here, we couldn't get any payment data
      console.log("No payment history found through any method")
      return []
    } catch (error) {
      console.error("Error in getPaymentHistory:", error)
      // Return an empty array instead of undefined to avoid null checks
      return []
    }
  }

  // Calculate likelihood of successful payment
  const calculateLikelihood = async (
    subscriptionId: bigint,
  ): Promise<{ likelihood: bigint; riskLevel: RiskLevel } | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "calculateLikelihood",
        args: [subscriptionId],
      })) as [bigint, RiskLevel]

      return {
        likelihood: data[0],
        riskLevel: data[1],
      }
    } catch (error) {
      console.error("Error calculating likelihood:", error)
      return undefined
    }
  }

  // Get payment prediction
  const getPrediction = async (
    subscriptionId: bigint,
  ): Promise<{ likelihood: bigint; lastUpdated: bigint; factors: string; riskLevel: RiskLevel } | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "getPrediction",
        args: [subscriptionId],
      })) as [bigint, bigint, string, RiskLevel]

      return {
        likelihood: data[0],
        lastUpdated: data[1],
        factors: data[2],
        riskLevel: data[3],
      }
    } catch (error) {
      console.error("Error getting prediction:", error)
      return undefined
    }
  }

  // Get high risk subscriptions
  const getHighRiskSubscriptions = async (limit: number): Promise<bigint[] | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "getHighRiskSubscriptions",
        args: [BigInt(limit)],
      })) as bigint[]

      return data
    } catch (error) {
      console.error("Error fetching high risk subscriptions:", error)
      return undefined
    }
  }

  // Get dispute details
  const getDispute = async (disputeId: bigint): Promise<Dispute | undefined> => {
    if (!publicClient) return undefined

    try {
      const data = (await publicClient.readContract({
        address: SUBPAY_ADDRESS as `0x${string}`,
        abi: SUBPAY_ABI,
        functionName: "getDispute",
        args: [disputeId],
      })) as Dispute

      return data
    } catch (error) {
      console.error("Error fetching dispute details:", error)
      return undefined
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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

    // Read data
    merchantPlans,
    subscriberSubscriptions,
    getDueSubscriptions,
    getPlanDetails,
    getSubscriptionDetails,
    getAllPlans,

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
  }
}

