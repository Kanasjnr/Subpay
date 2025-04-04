"use client"

import { useState, useEffect, useRef } from "react"
import { useAccount } from "wagmi"
import { Search, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { useSubPay } from "@/hooks/useSubPay"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OpenDisputeForm } from "@/components/subscription/OpenDisputeForm"
import { SubmitEvidenceForm } from "@/components/subscription/SubmitEvidenceForm"
import { useToast } from "@/hooks/use-toast"
import { Loading } from "@/components/ui/loading"
import { Empty } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import Image from "next/image"

// Define dispute status map
const DisputeStatusMap = {
  0: "None",
  1: "Open",
  2: "Evidence Submitted",
  3: "Resolved",
  4: "Cancelled",
}

// Define dispute interface
interface DisputeData {
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
  evidence: string
  planName?: string
  evidenceData?: {
    text: string
    images: string[]
  }
}

export default function DisputesPage() {
  const { address } = useAccount()
  const [search, setSearch] = useState("")
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false)
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<bigint | null>(null)
  const [selectedDisputeId, setSelectedDisputeId] = useState<bigint | null>(null)
  const [viewDisputeDetails, setViewDisputeDetails] = useState<DisputeData | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { subscriberSubscriptions, getDispute, getSubscriptionDetails, getPlanDetails } = useSubPay()
  const [loading, setLoading] = useState(true)
  const dataFetchedRef = useRef(false)
  const { toast } = useToast()

  console.log(
    "DisputesPage: Rendering with subscriberSubscriptions:",
    subscriberSubscriptions?.map((id) => id.toString()),
  )

  // Function to fetch all disputes for the current user
  useEffect(() => {
    const fetchDisputes = async () => {
      // Prevent multiple fetches in development mode (React 18 strict mode)
      if (dataFetchedRef.current) return
      if (!address || !subscriberSubscriptions) return

      console.log("DisputesPage: Fetching disputes for address:", address)
      try {
        setLoading(true)

        // In a real implementation, we would need a contract function to get all disputes for a user
        const disputesData: DisputeData[] = []

        // For each subscription, check if there's an associated dispute
        for (const subscriptionId of subscriberSubscriptions) {
          try {
            console.log("DisputesPage: Checking subscription for disputes:", subscriptionId.toString())

            // Get subscription details
            const subscription = await getSubscriptionDetails(subscriptionId)
            if (!subscription) continue

            // Get dispute details - use the actual dispute ID from the contract
            // Here we're using the subscription ID directly, but in a real implementation
            // you would get the actual dispute ID from the contract
            const dispute = await getDispute(subscriptionId)
            if (!dispute) continue

            // Get plan details to get the plan name
            let planName = "Unknown Plan"
            if (subscription.planId) {
              const plan = await getPlanDetails(subscription.planId)
              if (plan) {
                // Extract the plan name from the metadata
                if (plan.metadata) {
                  try {
                    // Try to parse the metadata as JSON
                    const metadata = JSON.parse(plan.metadata)
                    if (metadata && metadata.name) {
                      planName = metadata.name
                    } else {
                      // If no name in metadata, use the raw metadata if it's a string
                      planName =
                        typeof plan.metadata === "string" ? plan.metadata : `Plan #${subscription.planId.toString()}`
                    }
                  } catch (error) {
                    // If metadata is not valid JSON, use it directly as the plan name
                    planName = plan.metadata
                  }
                } else {
                  planName = `Plan #${subscription.planId.toString()}`
                }
              }
            }

            // Parse evidence data if it exists and is in JSON format
            let evidenceData
            if (dispute.evidence) {
              try {
                evidenceData = JSON.parse(dispute.evidence)
                console.log("DisputesPage: Parsed evidence data:", evidenceData)
              } catch (e) {
                // If not valid JSON, treat as plain text
                console.log("DisputesPage: Evidence is not JSON format, treating as plain text")
                evidenceData = { text: dispute.evidence, images: [] }
              }
            }

            // Add to disputes list with real data
            disputesData.push({
              id: dispute.id || subscriptionId,
              subscriptionId,
              subscriber: dispute.subscriber || address,
              merchant: dispute.merchant || "0xMerchant",
              paymentToken: dispute.paymentToken || "0xToken",
              amount: dispute.amount || dispute.refundAmountValue || 1000000000000000000n,
              createdAt: dispute.createdAt || BigInt(Math.floor(Date.now() / 1000) - 86400),
              resolvedAt: dispute.resolvedAt || 0n,
              status: dispute.status || 1,
              resolution: dispute.resolution || 0,
              reason: dispute.reason || "Dispute reason",
              evidence: dispute.evidence || "",
              planName,
              evidenceData,
            })
          } catch (error) {
            console.error(`DisputesPage: Error processing subscription ${subscriptionId}:`, error)
          }
        }

        console.log("DisputesPage: Found disputes:", disputesData)
        setDisputes(disputesData)
        dataFetchedRef.current = true
      } catch (error) {
        console.error("DisputesPage: Error fetching disputes:", error)
        toast({
          title: "Error",
          description: "Failed to fetch disputes. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [address, subscriberSubscriptions, getDispute, getSubscriptionDetails, getPlanDetails, toast])

  const filteredDisputes = disputes.filter(
    (dispute) =>
      dispute.planName?.toLowerCase().includes(search.toLowerCase()) ||
      dispute.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      dispute.reason?.toLowerCase().includes(search.toLowerCase()),
  )

  console.log("DisputesPage: Filtered disputes:", {
    total: disputes.length,
    filtered: filteredDisputes.length,
    searchTerm: search,
  })

  const handleOpenNewDispute = () => {
    if (subscriberSubscriptions && subscriberSubscriptions.length > 0) {
      console.log("DisputesPage: Opening new dispute modal with subscription:", subscriberSubscriptions[0].toString())
      setSelectedSubscriptionId(subscriberSubscriptions[0])
      setShowNewDisputeModal(true)
    } else {
      console.log("DisputesPage: No subscriptions available for disputes")
      toast({
        title: "No Subscriptions",
        description: "You don't have any active subscriptions to dispute",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (dispute: DisputeData) => {
    console.log("DisputesPage: Viewing dispute details:", dispute)
    setViewDisputeDetails(dispute)
    setShowDetailsModal(true)
  }

  const handleSubmitEvidence = (disputeId: bigint) => {
    console.log("DisputesPage: Opening submit evidence modal for dispute:", disputeId.toString())
    setSelectedDisputeId(disputeId)
    setShowEvidenceModal(true)
  }

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

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

  const hasEvidenceImages = (dispute: DisputeData) => {
    return dispute.evidenceData?.images && dispute.evidenceData.images.length > 0
  }

  if (!address) {
    return (
      <DashboardLayout type="subscriber">
        <Empty title="Connect Wallet" message="Please connect your wallet to view disputes" />
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout type="subscriber">
        <Loading size="lg" message="Loading your disputes..." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout type="subscriber">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Disputes</h1>
            <p className="text-muted-foreground mt-1">Manage your subscription disputes</p>
          </div>
          {disputes.filter((d) => d.status === 1).length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {disputes.filter((d) => d.status === 1).length} Active Disputes
              </span>
            </div>
          )}
        </div>

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
              <Button onClick={handleOpenNewDispute}>Open New Dispute</Button>
            </div>
          </CardHeader>
          <CardContent>
            {disputes.length === 0 ? (
              <Empty
                title="No Disputes Found"
                message="You haven't opened any disputes yet"
                action={{
                  label: "Open Dispute",
                  onClick: handleOpenNewDispute,
                }}
              />
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div className="md:col-span-1">Plan</div>
                  <div className="md:col-span-1">Merchant</div>
                  <div className="md:col-span-1">Amount</div>
                  <div className="md:col-span-1">Date</div>
                  <div className="md:col-span-1">Status</div>
                  <div className="md:col-span-1">Actions</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredDisputes.map((dispute) => (
                    <div
                      key={dispute.id.toString()}
                      className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 items-center text-sm"
                    >
                      <div className="md:col-span-1">{dispute.planName}</div>
                      <div className="md:col-span-1 font-mono truncate">{dispute.merchant}</div>
                      <div className="md:col-span-1">{formatEther(dispute.amount)} CELO</div>
                      <div className="md:col-span-1">
                        {new Date(Number(dispute.createdAt) * 1000).toLocaleDateString()}
                      </div>
                      <div className="md:col-span-1">
                        <Badge variant={getStatusBadgeVariant(dispute.status)}>
                          {DisputeStatusMap[dispute.status as keyof typeof DisputeStatusMap]}
                        </Badge>
                      </div>
                      <div className="md:col-span-1 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(dispute)}>
                          View Details
                        </Button>
                        {dispute.status === 1 && (
                          <Button variant="outline" size="sm" onClick={() => handleSubmitEvidence(dispute.id)}>
                            Submit Evidence
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Dispute Modal */}
        <Dialog open={showNewDisputeModal} onOpenChange={setShowNewDisputeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a Dispute</DialogTitle>
            </DialogHeader>
            {selectedSubscriptionId && (
              <OpenDisputeForm
                subscriptionId={selectedSubscriptionId}
                onSuccess={() => {
                  setShowNewDisputeModal(false)
                  setSelectedSubscriptionId(null)
                  // Refresh disputes list
                  window.location.reload()
                }}
                onCancel={() => {
                  setShowNewDisputeModal(false)
                  setSelectedSubscriptionId(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Submit Evidence Modal */}
        <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Evidence</DialogTitle>
            </DialogHeader>
            {selectedDisputeId && (
              <SubmitEvidenceForm
                disputeId={selectedDisputeId}
                onSuccess={() => {
                  setShowEvidenceModal(false)
                  setSelectedDisputeId(null)
                  // Refresh disputes list
                  window.location.reload()
                }}
                onCancel={() => {
                  setShowEvidenceModal(false)
                  setSelectedDisputeId(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dispute Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
            </DialogHeader>
            {viewDisputeDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Plan</h3>
                    <p>{viewDisputeDetails.planName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <Badge variant={getStatusBadgeVariant(viewDisputeDetails.status)} className="mt-1">
                      {DisputeStatusMap[viewDisputeDetails.status as keyof typeof DisputeStatusMap]}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Merchant</h3>
                    <p className="font-mono text-sm break-all">{viewDisputeDetails.merchant}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                    <p>{formatEther(viewDisputeDetails.amount)} CELO</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p>{new Date(Number(viewDisputeDetails.createdAt) * 1000).toLocaleString()}</p>
                  </div>
                  {viewDisputeDetails.resolvedAt > 0n && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Resolved</h3>
                      <p>{new Date(Number(viewDisputeDetails.resolvedAt) * 1000).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reason</h3>
                  <p className="mt-1 p-3 bg-muted rounded-md">{viewDisputeDetails.reason}</p>
                </div>

                {/* Display evidence text and images if available */}
                {viewDisputeDetails.evidenceData ? (
                  <>
                    {viewDisputeDetails.evidenceData.text && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Evidence Text</h3>
                        <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                          {viewDisputeDetails.evidenceData.text}
                        </p>
                      </div>
                    )}

                    {viewDisputeDetails.evidenceData.images && viewDisputeDetails.evidenceData.images.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Evidence Images ({viewDisputeDetails.evidenceData.images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {viewDisputeDetails.evidenceData.images.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleViewImage(imageUrl)}
                            >
                              <Image
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Evidence ${index + 1}`}
                                width={200}
                                height={200}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : viewDisputeDetails.evidence ? (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Evidence</h3>
                    <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">{viewDisputeDetails.evidence}</p>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2 pt-4">
                  {viewDisputeDetails.status === 1 && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleSubmitEvidence(viewDisputeDetails.id)
                      }}
                    >
                      Submit Evidence
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Viewer Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Evidence Image</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="flex justify-center">
                <div className="relative max-h-[70vh] max-w-full">
                  <Image
                    src={selectedImage || "/placeholder.svg"}
                    alt="Evidence"
                    width={800}
                    height={600}
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowImageModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

