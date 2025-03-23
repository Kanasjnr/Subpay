"use client"

import { useEffect, useState, useRef } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Empty } from "@/components/ui/empty"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionListProps {
  type?: "subscriber" | "business"
  onOpenDispute?: (subscriptionId: bigint) => void
}

export function SubscriptionList({ type = "subscriber", onOpenDispute }: SubscriptionListProps) {
  const { address } = useAccount()
  const { subscriberSubscriptions, cancelSubscription, getSubscriptionDetails, getPlanDetails } = useSubPay()
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)
  const hasInitializedRef = useRef(false)

  // Add subscription stats
  const subscriptionStats = {
    active: subscriptions.filter(sub => sub?.status === 0).length,
    canceled: subscriptions.filter(sub => sub?.status === 1).length,
    total: subscriptions.length
  }

  // Helper function to safely format ether values
  const safeFormatEther = (value: bigint | undefined) => {
    if (value === undefined) {
      console.log("Warning: Attempting to format undefined value as ether")
      return "0"
    }
    try {
      return formatEther(value)
    } catch (error) {
      console.error("Error formatting ether value:", error)
      return "0"
    }
  }

  // Handle mounting state
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Update the getSubscriptionDetails function to properly map the array response to an object
  useEffect(() => {
    if (!mounted || !address || !subscriberSubscriptions || hasInitializedRef.current) {
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)

        if (!Array.isArray(subscriberSubscriptions) || subscriberSubscriptions.length === 0) {
          setSubscriptions([])
          return
        }

        const subscriptionDetails = await Promise.all(
          subscriberSubscriptions.map(async (id: bigint) => {
            try {
              const subscription = await getSubscriptionDetails(id)
              if (!subscription) return null

              // Get plan details to get the amount
              const plan = await getPlanDetails(subscription.planId)
              if (!plan) return null

              return {
                id,
                subscriber: subscription.subscriber,
                merchant: plan.merchant,
                planId: subscription.planId,
                startTime: subscription.startTime,
                lastPaymentTime: subscription.lastPaymentTime,
                nextPaymentTime: subscription.nextPaymentTime,
                amount: plan.amount,
                status: !subscription.active ? 1 : 0, // Fix status logic: 0 = Active, 1 = Cancelled
                planName: plan.metadata || `Plan #${subscription.planId.toString()}`,
              }
            } catch (err) {
              console.error(`Error fetching subscription ${id.toString()}:`, err)
              return null
            }
          }),
        )

        const validSubscriptions = subscriptionDetails.filter((sub): sub is any => sub !== null)
        setSubscriptions(validSubscriptions)
        hasInitializedRef.current = true
      } catch (err) {
        console.error("Error fetching subscriptions:", err)
        toast({
          title: "Error",
          description: "Failed to fetch subscriptions. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, address, subscriberSubscriptions])

  // Reset initialization when subscriptions change
  useEffect(() => {
    if (subscriberSubscriptions && subscriberSubscriptions.length === 0) {
      hasInitializedRef.current = false
    }
  }, [subscriberSubscriptions])

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Active"
      case 1:
        return "Cancelled"
      case 2:
        return "Expired"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return "text-green-500"
      case 1:
        return "text-red-500"
      case 2:
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A"
    try {
      const date = new Date(Number(timestamp) * 1000)
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  if (!address) {
    return <Empty title="Connect Wallet" message="Please connect your wallet to view subscriptions" />
  }

  if (loading) {
    return <Loading size="lg" />
  }

  if (!subscriptions.length) {
    return (
      <Empty
        title="No subscriptions found"
        message={type === "subscriber" ? "You haven't subscribed to any plans yet" : "No active subscribers"}
      />
    )
  }

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      (sub.merchant?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (sub.subscriber?.toLowerCase() || "").includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {type === "subscriber" && (
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Active: </span>
              <span className="font-medium text-green-500">{subscriptionStats.active}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Canceled: </span>
              <span className="font-medium text-red-500">{subscriptionStats.canceled}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.id ? subscription.id.toString() : "unknown"}>
            <CardHeader>
              <CardTitle>{subscription.planName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{safeFormatEther(subscription.amount)} cUSD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{formatDate(subscription.startTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Next Payment</span>
                  <span className="font-medium">{formatDate(subscription.nextPaymentTime)}</span>
                </div>
                {type === "subscriber" && subscription.status === 0 && subscription.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => cancelSubscription(subscription.id)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => subscription.id && onOpenDispute?.(subscription.id)}
                    >
                      Open Dispute
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

