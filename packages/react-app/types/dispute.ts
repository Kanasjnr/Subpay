// Define dispute interface
export interface DisputeData {
  id: bigint
  subscriptionId: bigint
  subscriber: string
  merchant: string
  paymentToken: string
  amount: bigint
  createdAt: bigint
  resolvedAt: bigint
  status: number
  resolution: number
  reason: string
  merchantEvidence: string
  subscriberEvidence: string
  resolutionNotes: string
  resolver: string
  refundAmount: bigint
  planName?: string
  evidenceData?: {
    text: string
    images: string[]
  }
  merchantEvidenceData?: {
    text: string
    images: string[]
  }
  subscriberEvidenceData?: {
    text: string
    images: string[]
  }
}

// Define dispute status map
export const DisputeStatusMap = {
  0: "None",
  1: "Open",
  2: "Evidence Submitted",
  3: "Resolved",
  4: "Cancelled",
} as const 