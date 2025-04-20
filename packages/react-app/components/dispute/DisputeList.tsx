"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { useToast } from "@/components/ui/use-toast"
import { DisputeCard } from "./DisputeCard"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { Address } from "viem"
import { useAccount, useContractRead } from "wagmi"
import { disputeContract } from "@/lib/contracts"
import { formatEther } from "viem"
import { FraudDetection } from "./FraudDetection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define enums to match the contract
export enum DisputeStatus {
  Opened = 0,
  EvidenceSubmitted = 1,
  Resolved = 2,
  Cancelled = 3
}

export enum Resolution {
  Pending = 0,
  MerchantWins = 1,
  SubscriberWins = 2,
  Compromise = 3
}

interface DisputeData {
  id: number
  disputeId: number
  status: DisputeStatus
  planName: string
  amount: bigint
  reason: string
  resolution: Resolution
  refundAmount: bigint
  uniqueKey: string
}

interface DisputeListProps {
  type: "business" | "subscriber"
}

interface ContractDispute {
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

interface SubscriptionPlan {
  merchant: Address
  paymentToken: Address
  amount: bigint
  frequency: bigint
  trialPeriod: bigint
  active: boolean
  metadata: string
}

interface DisputeCardProps {
  dispute: {
    id: number
    disputeId: number
    status: DisputeStatus
    planName: string
    amount: bigint
    reason: string
    resolution: Resolution
    refundAmount: bigint
    uniqueKey: string
  }
  onResolve: (dispute: DisputeData) => void
}

// Move fetch logic outside component
const fetchDisputesForAddress = async (
  address: string,
  type: "business" | "subscriber",
  getDispute: (id: bigint) => Promise<any>,
  getPlanDetails: (id: bigint) => Promise<any>
) => {
  if (!address) {
    return []
  }
  
  const allDisputes: ContractDispute[] = []
  let id = 1n
  
  while (true) {
    try {
      const dispute = await getDispute(id)
      if (!dispute) break
      
      if (type === "subscriber" && dispute.subscriber.toLowerCase() === address.toLowerCase()) {
        allDisputes.push(dispute)
      } else if (type === "business" && dispute.merchant.toLowerCase() === address.toLowerCase()) {
        allDisputes.push(dispute)
      }
      
      id++
    } catch (error) {
      break
    }
  }
  
  const formattedDisputes = await Promise.all(
    allDisputes.map(async (dispute, index) => {
      try {
        const plan = await getPlanDetails(dispute.subscriptionId)
        const planName = plan?.metadata || "Unknown Plan"
        
        return {
          id: Number(dispute.subscriptionId),
          disputeId: Number(index + 1),
          status: dispute.status,
          planName,
          amount: dispute.amount,
          reason: dispute.reason,
          resolution: dispute.resolution,
          refundAmount: dispute.refundAmount,
          uniqueKey: `${dispute.subscriptionId}-${dispute.status}-${dispute.reason}`
        }
      } catch (error) {
        return null
      }
    })
  )
  
  return formattedDisputes.filter((dispute): dispute is DisputeData => dispute !== null)
}

export function DisputeList({ type }: DisputeListProps) {
  const { address } = useAccount()
  const { getDispute, getPlanDetails } = useSubPay()
  const [search] = useState("")
  const [statusFilter] = useState<"all" | "open" | "resolved" | "cancelled">("all")
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDispute] = useState(false)
  const mountedRef = useRef(false)

  // Memoize the fetch function with all dependencies
  const fetchAndSetDisputes = useCallback(async () => {
    if (!address || !mountedRef.current) return
    
    setIsLoading(true)
    try {
      const fetchedDisputes = await fetchDisputesForAddress(
        address,
        type,
        getDispute,
        getPlanDetails
      )
      if (mountedRef.current) {
        setDisputes(fetchedDisputes)
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [address, type, getDispute, getPlanDetails])

  // Only fetch once on mount
  useEffect(() => {
    mountedRef.current = true
    fetchAndSetDisputes()
    return () => {
      mountedRef.current = false
    }
  }, [fetchAndSetDisputes])

  // Memoize filtered disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      if (statusFilter === "all") return true
      if (statusFilter === "open") return dispute.status === DisputeStatus.Opened || dispute.status === DisputeStatus.EvidenceSubmitted
      if (statusFilter === "resolved") return dispute.status === DisputeStatus.Resolved
      if (statusFilter === "cancelled") return dispute.status === DisputeStatus.Cancelled
      return true
    })
  }, [disputes, statusFilter])

  // Memoize the resolve handler
  const handleResolveDispute = useCallback((dispute: DisputeData) => {
    console.log('Resolving dispute:', dispute)
  }, [])

  // Memoize the entire render output
  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading disputes...</p>
        </div>
      )
    }

    if (!address) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Please connect your wallet to view disputes</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Tabs defaultValue="disputes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="disputes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Dispute Resolution</h2>
              <Button onClick={() => {}}>
                Create Dispute
              </Button>
            </div>

            {filteredDisputes.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No disputes found</AlertTitle>
                <AlertDescription>
                  {type === "business"
                    ? "You have no active disputes with subscribers."
                    : "You have no active disputes with businesses."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDisputes.map((dispute) => (
                  <DisputeCard
                    key={dispute.uniqueKey}
                    dispute={dispute}
                    onResolve={handleResolveDispute}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fraud">
            <FraudDetection />
          </TabsContent>
        </Tabs>
      </div>
    )
  }, [isLoading, address, filteredDisputes, type, handleResolveDispute])

  return renderContent
}

