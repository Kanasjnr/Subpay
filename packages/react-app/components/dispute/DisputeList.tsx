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
  None = 0,
  Opened = 1,
  EvidenceSubmitted = 2,
  Resolved = 3,
  Cancelled = 4
}

export enum Resolution {
  None = 0,
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
  type: "business" | "subscriber"
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
  
  try {
    // Set a reasonable limit to prevent infinite loops
    const maxAttempts = 50
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const dispute = await getDispute(id)
        if (!dispute || !dispute.subscriptionId) break
        
        if (type === "subscriber" && dispute.subscriber.toLowerCase() === address.toLowerCase()) {
          allDisputes.push(dispute)
        } else if (type === "business" && dispute.merchant.toLowerCase() === address.toLowerCase()) {
          allDisputes.push(dispute)
        }
        
        id++
        attempts++
      } catch (error) {
        console.error('Error fetching dispute:', error)
        break
      }
    }
  } catch (error) {
    console.error('Error in dispute fetching loop:', error)
  }
  
  if (allDisputes.length === 0) {
    return []
  }
  
  try {
    const formattedDisputes = await Promise.all(
      allDisputes.map(async (dispute, index) => {
        try {
          const plan = await getPlanDetails(dispute.subscriptionId)
          const planName = plan?.metadata || "Unknown Plan"
          
          // Map contract status to enum
          const status = Number(dispute.status)
          const mappedStatus = status === 0 ? DisputeStatus.None :
                             status === 1 ? DisputeStatus.Opened :
                             status === 2 ? DisputeStatus.EvidenceSubmitted :
                             status === 3 ? DisputeStatus.Resolved :
                             status === 4 ? DisputeStatus.Cancelled :
                             DisputeStatus.None // Default to None if unknown
          
          // Map contract resolution to enum
          const resolution = Number(dispute.resolution)
          const mappedResolution = resolution === 0 ? Resolution.None :
                                 resolution === 1 ? Resolution.MerchantWins :
                                 resolution === 2 ? Resolution.SubscriberWins :
                                 resolution === 3 ? Resolution.Compromise :
                                 Resolution.None // Default to None if unknown
          
          return {
            id: Number(dispute.subscriptionId),
            disputeId: Number(index + 1),
            status: mappedStatus,
            planName,
            amount: dispute.amount,
            reason: dispute.reason,
            resolution: mappedResolution,
            refundAmount: dispute.refundAmount,
            uniqueKey: `${dispute.subscriptionId}-${mappedStatus}-${dispute.reason}`
          }
        } catch (error) {
          console.error('Error formatting dispute:', error)
          return null
        }
      })
    )
    
    return formattedDisputes.filter((dispute): dispute is DisputeData => dispute !== null)
  } catch (error) {
    console.error('Error formatting disputes:', error)
    return []
  }
}

export function DisputeList({ type }: DisputeListProps) {
  const { address } = useAccount()
  const { getDispute, getPlanDetails, getSubscriptionDetails, subscriberSubscriptions, merchantPlans } = useSubPay()
  const [search] = useState("")
  const [statusFilter] = useState<"all" | "open" | "resolved" | "cancelled">("all")
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDispute] = useState(false)
  const mountedRef = useRef(false)
  const isInitialMount = useRef(true)
  const [isArbitrator] = useState(false)

  // Memoize the fetch function with all dependencies
  const fetchAndSetDisputes = useCallback(async () => {
    if (!address || !mountedRef.current) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)
    console.log(`Fetching disputes for ${type} with address:`, address)
    
    try {
      const fetchedDisputes = await fetchDisputesForAddress(
        address,
        type,
        getDispute,
        getPlanDetails
      )
      
      console.log('Fetched disputes:', fetchedDisputes)
      
      if (mountedRef.current) {
        setDisputes(fetchedDisputes)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
      if (mountedRef.current) {
        setError('Failed to load disputes. Please try again.')
        setIsLoading(false)
      }
    }
  }, [address, type, getDispute, getPlanDetails])

  // Only fetch on mount or when address/type changes
  useEffect(() => {
    mountedRef.current = true
    fetchAndSetDisputes()
    return () => {
      mountedRef.current = false
    }
  }, [address, type])

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
    console.log('Render content state:', { isLoading, error, address, filteredDisputes })

    if (!address) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Please connect your wallet to view disputes</p>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading disputes...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <Alert>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!disputes || disputes.length === 0) {
      return <div>No disputes found</div>
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

            <div className="grid gap-4">
              {filteredDisputes.map((dispute) => (
                <DisputeCard
                  key={dispute.uniqueKey}
                  dispute={dispute}
                  onResolve={handleResolveDispute}
                  type={type}
                  isArbitrator={isArbitrator}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="fraud">
            <FraudDetection />
          </TabsContent>
        </Tabs>
      </div>
    )
  }, [isLoading, error, address, filteredDisputes, handleResolveDispute, isArbitrator])

  // Add debug logging for state changes
  useEffect(() => {
    console.log('State updated:', { isLoading, error, disputes, filteredDisputes })
  }, [isLoading, error, disputes, filteredDisputes])

  return renderContent
}

