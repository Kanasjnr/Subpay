"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Search, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { useSubPay } from "@/hooks/useSubPay"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OpenDisputeForm } from "@/components/subscription/OpenDisputeForm"
import { useToast } from "@/hooks/use-toast"
import { Loading } from "@/components/ui/loading"
import { Empty } from "@/components/ui/empty"

export default function DisputesPage() {
  const { address } = useAccount()
  const [search, setSearch] = useState("")
  const [disputes, setDisputes] = useState<any[]>([])
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<bigint | null>(null)
  const { subscriberSubscriptions, getDispute } = useSubPay()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Function to fetch all disputes for the current user
  useEffect(() => {
    const fetchDisputes = async () => {
      if (!address) return

      try {
        setLoading(true)

        // In a real implementation, we would need a contract function to get all disputes for a user
        // For now, we'll use an empty array since the contract doesn't have this function yet
        setDisputes([])
      } catch (error) {
        console.error("Error fetching disputes:", error)
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
  }, [address, toast])

  const filteredDisputes = disputes.filter(
    (dispute) =>
      dispute.planName?.toLowerCase().includes(search.toLowerCase()) ||
      dispute.merchant?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenNewDispute = () => {
    if (subscriberSubscriptions && subscriberSubscriptions.length > 0) {
      setSelectedSubscriptionId(subscriberSubscriptions[0])
      setShowNewDisputeModal(true)
    } else {
      toast({
        title: "No Subscriptions",
        description: "You don't have any active subscriptions to dispute",
        variant: "destructive",
      })
    }
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
        <Loading size="lg" />
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
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {disputes.filter((d) => d.status === "Open").length} Active Disputes
            </span>
          </div>
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
                <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div>Plan</div>
                  <div>Merchant</div>
                  <div>Amount</div>
                  <div>Date</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredDisputes.map((dispute) => (
                    <div key={dispute.id} className="grid grid-cols-6 gap-4 p-4 items-center text-sm">
                      <div>{dispute.planName}</div>
                      <div className="font-mono">{dispute.merchant}</div>
                      <div>{dispute.amount}</div>
                      <div>{dispute.date}</div>
                      <div>
                        <span className={`status-badge ${dispute.status.toLowerCase()}`}>{dispute.status}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {dispute.status === "Open" && (
                          <Button variant="outline" size="sm">
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
      </div>
    </DashboardLayout>
  )
}

