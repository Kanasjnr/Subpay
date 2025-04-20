import { Address } from 'viem'

export interface SubscriptionPlan {
  merchant: Address
  paymentToken: Address
  amount: bigint
  frequency: bigint
  trialPeriod: bigint
  active: boolean
  metadata: string
}

export interface Subscription {
  planId: bigint
  subscriber: Address
  merchant: Address
  paymentToken: Address
  amount: bigint
  frequency: bigint
  startTime: bigint
  nextPaymentTime: bigint
  status: 'active' | 'cancelled' | 'disputed'
  metadata: string
}

export interface Dispute {
  subscriptionId: bigint
  subscriber: Address
  merchant: Address
  paymentToken: Address
  amount: bigint
  createdAt: bigint
  resolvedAt: bigint
  status: number
  resolution: number
  reason: string
  merchantEvidence: string
  subscriberEvidence: string
  resolutionNotes: string
  resolver: Address
  refundAmount: bigint
}

export interface PaymentHistory {
  timestamp: bigint
  success: boolean
  amount: bigint
  token: Address
  metadata: string
}

export type ResolutionType = 'refund' | 'continue' | 'cancel'

export enum Resolution {
  None = 0,
  MerchantWins = 1,
  SubscriberWins = 2,
  Compromise = 3
}

export enum DisputeStatus {
  None = 0,
  Opened = 1,
  EvidenceSubmitted = 2,
  Resolved = 3,
  Cancelled = 4
} 