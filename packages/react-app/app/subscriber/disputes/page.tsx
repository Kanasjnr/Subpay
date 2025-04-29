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
import { ResolveDisputeForm } from "@/components/subscription/ResolveDisputeForm"
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

export default function DisputesPage() {
  const { address } = useAccount()
  const [search, setSearch] = useState("")
  const [disputes, setDisputes] = useState<DisputeData[]>([])
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false)
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<bigint | null>(null)
  const [selectedDisputeId, setSelectedDisputeId] = useState<bigint | null>(null)
  const [viewDisputeDetails, setViewDisputeDetails] = useState<DisputeData | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { subscriberSubscriptions, getDispute, getSubscriptionDetails, getPlanDetails, isArbitrator } = useSubPay()
  const [loading, setLoading] = useState(true)
  const dataFetchedRef = useRef(false)
  const { toast } = useToast()

  console.log(
    "DisputesPage: Rendering with subscriberSubscriptions:",
    subscriberSubscriptions?.map((id) => id.toString()),
  )

  const fetchDisputes = async () => {
    if (!address || !subscriberSubscriptions) return

    try {
      setLoading(true)
      const disputesData: DisputeData[] = []
      
      // Get all disputes for each subscription
      for (const subscriptionId of subscriberSubscriptions) {
        try {
          // Get subscription details to get the plan ID
          const subscription = await getSubscriptionDetails(subscriptionId)
          if (!subscription) continue

          // Get plan details to get the plan name
          const plan = await getPlanDetails(subscription.planId)
          const planName = plan?.metadata || "Unknown Plan"

          // Get dispute for this subscription
          const dispute = await getDispute(subscriptionId)
          if (!dispute) continue

          // Only include disputes where the current user is the subscriber
          if (dispute.subscriber.toLowerCase() === address.toLowerCase()) {
            // Parse evidence data if it exists
            let merchantEvidenceData = { text: "", images: [] }
            let subscriberEvidenceData = { text: "", images: [] }

            if (dispute.merchantEvidence) {
              try {
                merchantEvidenceData = JSON.parse(dispute.merchantEvidence)
              } catch (e) {
                merchantEvidenceData = { text: dispute.merchantEvidence, images: [] }
              }
            }

            if (dispute.subscriberEvidence) {
              try {
                subscriberEvidenceData = JSON.parse(dispute.subscriberEvidence)
              } catch (e) {
                subscriberEvidenceData = { text: dispute.subscriberEvidence, images: [] }
              }
            }

            const disputeData: DisputeData = {
              id: subscriptionId, // Use subscriptionId as the dispute ID
              subscriptionId: dispute.subscriptionId,
              subscriber: dispute.subscriber,
              merchant: dispute.merchant,
              paymentToken: dispute.paymentToken,
              amount: dispute.amount || dispute.refundAmount || 1000000000000000000n,
              createdAt: dispute.createdAt,
              resolvedAt: dispute.resolvedAt,
              status: dispute.status,
              resolution: dispute.resolution,
              reason: dispute.reason,
              merchantEvidence: dispute.merchantEvidence || "",
              subscriberEvidence: dispute.subscriberEvidence || "",
              resolutionNotes: dispute.resolutionNotes || "",
              resolver: dispute.resolver || "0xResolver",
              refundAmount: dispute.refundAmount || 0n,
              planName,
              merchantEvidenceData,
              subscriberEvidenceData
            }

            disputesData.push(disputeData)
          }
        } catch (error) {
          console.error(`Error fetching dispute for subscription ${subscriptionId}:`, error)
          continue
        }
      }

      setDisputes(disputesData)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch disputes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address && subscriberSubscriptions && !dataFetchedRef.current) {
      fetchDisputes()
      dataFetchedRef.current = true
    }
  }, [address, subscriberSubscriptions])

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

  const handleSubmitEvidence = (disputeId: bigint, status: number) => {
    console.log("DisputesPage: Opening submit evidence modal for dispute:", disputeId.toString(), "Status:", status)

    // Allow evidence submission for both open disputes (status === 1) and evidence submitted disputes (status === 2)
    if (status !== 1 && status !== 2) {
      toast({
        title: "Cannot Submit Evidence",
        description: "Evidence can only be submitted for open or ongoing disputes",
        variant: "destructive",
      })
      return
    }

    setSelectedDisputeId(disputeId)
    setShowEvidenceModal(true)
  }

  const handleResolveDispute = (disputeId: bigint) => {
    console.log("DisputesPage: Opening resolve dispute modal for dispute:", disputeId.toString())
    setSelectedDisputeId(disputeId)
    setShowResolveModal(true)
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
    return (
      (dispute.evidenceData?.images && dispute.evidenceData.images.length > 0) ||
      (dispute.subscriberEvidenceData?.images && dispute.subscriberEvidenceData.images.length > 0) ||
      (dispute.merchantEvidenceData?.images && dispute.merchantEvidenceData.images.length > 0)
    )
  }

  if (!address) {
    return (
      <DashboardLayout type="subscriber">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loading size="lg" />
            <p className="text-muted-foreground">Loading your disputes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout type="subscriber">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loading size="lg" />
            <p className="text-muted-foreground">Loading your disputes...</p>
          </div>
        </div>
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
                      <div className="md:col-span-1">{formatEther(dispute.amount)} cUSD</div>
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
                        {(dispute.status === 1 || dispute.status === 2) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmitEvidence(dispute.id, dispute.status)}
                          >
                            Submit Evidence
                          </Button>
                        )}
                        {isArbitrator && (dispute.status === 1 || dispute.status === 2) && (
                          <Button variant="secondary" size="sm" onClick={() => handleResolveDispute(dispute.id)}>
                            Resolve
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

        {/* Resolve Dispute Modal */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
            </DialogHeader>
            {selectedDisputeId && (
              <ResolveDisputeForm
                disputeData={disputes.find(d => d.id === selectedDisputeId)}
                onSuccess={() => {
                  setShowResolveModal(false)
                  fetchDisputes()
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
                    <p>{formatEther(viewDisputeDetails.amount)} cUSD</p>
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

                {/* Display subscriber evidence */}
                {viewDisputeDetails.subscriberEvidenceData && (
                  <div className="border rounded-md p-4 bg-blue-50">
                    <h3 className="text-sm font-medium mb-2">Subscriber Evidence</h3>

                    {viewDisputeDetails.subscriberEvidenceData.text && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Text</h4>
                        <p className="mt-1 p-3 bg-white rounded-md whitespace-pre-wrap">
                          {viewDisputeDetails.subscriberEvidenceData.text}
                        </p>
                      </div>
                    )}

                    {viewDisputeDetails.subscriberEvidenceData.images &&
                      viewDisputeDetails.subscriberEvidenceData.images.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Images ({viewDisputeDetails.subscriberEvidenceData.images.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            {viewDisputeDetails.subscriberEvidenceData.images.map((imageUrl, index) => (
                              <div
                                key={index}
                                className="aspect-square rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleViewImage(imageUrl)}
                              >
                                <Image
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={`Subscriber Evidence ${index + 1}`}
                                  width={200}
                                  height={200}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Display merchant evidence */}
                {viewDisputeDetails.merchantEvidenceData && (
                  <div className="border rounded-md p-4 bg-green-50">
                    <h3 className="text-sm font-medium mb-2">Merchant Evidence</h3>

                    {viewDisputeDetails.merchantEvidenceData.text && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Text</h4>
                        <p className="mt-1 p-3 bg-white rounded-md whitespace-pre-wrap">
                          {viewDisputeDetails.merchantEvidenceData.text}
                        </p>
                      </div>
                    )}

                    {viewDisputeDetails.merchantEvidenceData.images &&
                      viewDisputeDetails.merchantEvidenceData.images.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-muted-foreground">
                            Images ({viewDisputeDetails.merchantEvidenceData.images.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            {viewDisputeDetails.merchantEvidenceData.images.map((imageUrl, index) => (
                              <div
                                key={index}
                                className="aspect-square rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleViewImage(imageUrl)}
                              >
                                <Image
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={`Merchant Evidence ${index + 1}`}
                                  width={200}
                                  height={200}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Display general evidence (for backward compatibility) */}
                {viewDisputeDetails.evidenceData &&
                  !viewDisputeDetails.subscriberEvidenceData &&
                  !viewDisputeDetails.merchantEvidenceData && (
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
                  )}

                <div className="flex justify-end gap-2 pt-4">
                  {(viewDisputeDetails.status === 1 || viewDisputeDetails.status === 2) && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleSubmitEvidence(viewDisputeDetails.id, viewDisputeDetails.status)
                      }}
                    >
                      Submit Evidence
                    </Button>
                  )}

                  {isArbitrator && (viewDisputeDetails.status === 1 || viewDisputeDetails.status === 2) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleResolveDispute(viewDisputeDetails.id)
                      }}
                    >
                      Resolve Dispute
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

