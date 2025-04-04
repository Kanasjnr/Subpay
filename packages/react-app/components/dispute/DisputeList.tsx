"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useSubPay } from "@/hooks/useSubPay"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"

interface DisputeListProps {
  type: "business" | "subscriber"
  onViewDispute?: (disputeId: bigint) => void
}

interface DisputeData {
  id: bigint
  subscriber: string
  merchant: string
  paymentToken: string
  amount: bigint
  createdAt: bigint
  resolvedAt: bigint
  status: number
  resolution: number
  reason: string
  planName?: string
}

const DisputeStatusMap = {
  0: "None",
  1: "Open",
  2: "Evidence Submitted",
  3: "Resolved",
  4: "Cancelled",
}

const ResolutionMap = {
  0: "None",
  1: "Merchant Wins",
  2: "Subscriber Wins",
  3: "Compromise",
}

export function DisputeList({ type, onViewDispute }: DisputeListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [loading, setLoading] = useState(true)
  const { getDispute, getPlanDetails, getSubscriptionDetails, getDisputeCount, getDisputeIdAtIndex } = useSubPay()
  const { toast } = useToast()

  // Use a ref to track if the data has been fetched to prevent multiple fetches
  const dataFetchedRef = useRef(false)

  // Memoize the fetchDisputes function to prevent it from changing on every render
  const fetchDisputes = useCallback(async () => {
    // If data has already been fetched, don't fetch again
    if (dataFetchedRef.current) return

    console.log("DisputeList: Fetching disputes for type:", type)
    try {
      setLoading(true)

      // Get real dispute IDs from the contract
      const disputeIds: bigint[] = []

      try {
        // Get the total number of disputes from the contract
        const disputeCount = await getDisputeCount()
        console.log(`DisputeList: Total dispute count: ${disputeCount}`)

        if (disputeCount > 0) {
          // Fetch each dispute ID
          for (let i = 0; i < disputeCount; i++) {
            const disputeId = await getDisputeIdAtIndex(BigInt(i))
            if (disputeId) {
              disputeIds.push(disputeId)
            }
          }
        }

        console.log(`DisputeList: Fetched ${disputeIds.length} dispute IDs`)
      } catch (error) {
        console.error("DisputeList: Error fetching dispute IDs:", error)
        return
      }

      const disputesData: DisputeData[] = []

      for (const id of disputeIds) {
        try {
          console.log("DisputeList: Fetching dispute details for ID:", id.toString())
          const dispute = await getDispute(id)

          if (!dispute) {
            console.log(`DisputeList: No dispute found for ID ${id.toString()}`)
            continue
          }

          // Filter disputes based on type (business or subscriber)
          const isRelevantDispute =
            (type === "business" && dispute.merchant === window.ethereum?.selectedAddress) ||
            (type === "subscriber" && dispute.subscriber === window.ethereum?.selectedAddress)

          if (!isRelevantDispute) {
            console.log(`DisputeList: Dispute ${id.toString()} is not relevant for ${type}`)
            continue
          }

          console.log("DisputeList: Dispute data received:", dispute)

          // Get subscription details to get the plan ID
          console.log("DisputeList: Fetching subscription details for ID:", dispute.subscriptionId.toString())
          const subscription = await getSubscriptionDetails(dispute.subscriptionId)

          if (!subscription) {
            console.log(`DisputeList: No subscription found for ID ${dispute.subscriptionId.toString()}`)
            disputesData.push({
              id: id,
              subscriber: dispute.subscriber,
              merchant: dispute.merchant,
              paymentToken: dispute.paymentToken,
              amount: dispute.amount,
              createdAt: dispute.createdAt,
              resolvedAt: dispute.resolvedAt,
              status: dispute.status,
              resolution: dispute.resolution,
              reason: dispute.reason,
              planName: "Unknown Plan",
            })
            continue
          }

          console.log("DisputeList: Subscription data received:", subscription)

          // Get plan details to get the plan name
          let planName = "Unknown Plan"
          if (subscription && subscription.planId) {
            console.log("DisputeList: Fetching plan details for ID:", subscription.planId.toString())
            const plan = await getPlanDetails(subscription.planId)

            if (plan) {
              console.log("DisputeList: Plan data received:", plan)

              // Handle plan metadata safely
              if (plan.metadata) {
                // Check if metadata is a string that looks like JSON
                if (typeof plan.metadata === "string" && plan.metadata.trim().startsWith("{")) {
                  try {
                    const metadata = JSON.parse(plan.metadata)
                    planName = metadata.name || `Plan #${subscription.planId.toString()}`
                  } catch (parseError) {
                    // If JSON parsing fails, use the raw string
                    planName = plan.metadata
                  }
                } else {
                  // Use metadata directly as it's not JSON
                  planName = plan.metadata
                }
              } else {
                planName = `Plan #${subscription.planId.toString()}`
              }
            }
          }

          disputesData.push({
            id: id,
            subscriber: dispute.subscriber,
            merchant: dispute.merchant,
            paymentToken: dispute.paymentToken,
            amount: dispute.amount,
            createdAt: dispute.createdAt,
            resolvedAt: dispute.resolvedAt,
            status: dispute.status,
            resolution: dispute.resolution,
            reason: dispute.reason,
            planName,
          })
        } catch (error) {
          console.error(`DisputeList: Error fetching dispute ${id}:`, error)
        }
      }

      console.log("DisputeList: All disputes data:", disputesData)
      setDisputes(disputesData)
      // Mark data as fetched
      dataFetchedRef.current = true
    } catch (error) {
      console.error("DisputeList: Error fetching disputes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch disputes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getDispute, getPlanDetails, getSubscriptionDetails, getDisputeCount, getDisputeIdAtIndex, toast, type])

  // Use a separate useEffect for the initial data fetch
  useEffect(() => {
    // Reset the dataFetchedRef when the type changes
    dataFetchedRef.current = false
    fetchDisputes()

    return () => {
      // Cleanup function
    }
  }, [fetchDisputes, type])

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.subscriber.toLowerCase().includes(search.toLowerCase()) ||
      dispute.merchant.toLowerCase().includes(search.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || DisputeStatusMap[dispute.status as keyof typeof DisputeStatusMap] === statusFilter

    return matchesSearch && matchesStatus
  })

  console.log("DisputeList: Filtered disputes:", {
    total: disputes.length,
    filtered: filteredDisputes.length,
    searchTerm: search,
    statusFilter,
  })

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 1:
        return "default" // Open
      case 2:
        return "secondary" // Evidence Submitted
      case 3:
        return "success" // Resolved
      case 4:
        return "destructive" // Cancelled
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading disputes...</p>
        </div>
      </div>
    )
  }

  if (!disputes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Disputes Found</h3>
        <p className="text-muted-foreground mt-2">
          {type === "business"
            ? "You have no active disputes against your business"
            : "You haven't opened any disputes yet"}
        </p>
      </div>
    )
  }

  const openDisputesCount = disputes.filter((d) => d.status === 1).length

  return (
    <div className="space-y-8">
      {openDisputesCount > 0 && (
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {openDisputesCount} Open {openDisputesCount === 1 ? "Dispute" : "Disputes"}
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search disputes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Evidence Submitted">Evidence Submitted</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 bg-muted/50 text-sm font-medium">
              <div className="md:col-span-1">ID</div>
              <div className="md:col-span-1">{type === "business" ? "Subscriber" : "Merchant"}</div>
              <div className="md:col-span-1">Plan</div>
              <div className="md:col-span-1">Amount</div>
              <div className="md:col-span-1">Status</div>
              <div className="md:col-span-1">Date</div>
              <div className="md:col-span-1">Actions</div>
            </div>
            <div className="divide-y divide-border">
              {filteredDisputes.map((dispute) => (
                <div
                  key={dispute.id.toString()}
                  className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 items-center text-sm"
                >
                  <div className="md:col-span-1 font-mono">{dispute.id.toString()}</div>
                  <div className="md:col-span-1 font-mono truncate">
                    {type === "business" ? dispute.subscriber : dispute.merchant}
                  </div>
                  <div className="md:col-span-1">{dispute.planName}</div>
                  <div className="md:col-span-1">{formatEther(dispute.amount)} CELO</div>
                  <div className="md:col-span-1">
                    <Badge variant={getStatusBadgeVariant(dispute.status)}>
                      {DisputeStatusMap[dispute.status as keyof typeof DisputeStatusMap]}
                    </Badge>
                  </div>
                  <div className="md:col-span-1">{new Date(Number(dispute.createdAt) * 1000).toLocaleDateString()}</div>
                  <div className="md:col-span-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("DisputeList: View dispute clicked for ID:", dispute.id.toString())
                        onViewDispute?.(dispute.id)
                      }}
                    >
                      View
                    </Button>
                    {dispute.status === 1 && type === "subscriber" && (
                      <Button variant="destructive" size="sm">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

