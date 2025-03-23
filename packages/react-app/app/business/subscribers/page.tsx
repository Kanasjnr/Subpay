"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAccount } from "wagmi"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { useSubPay } from "@/hooks/useSubPay"
import { useToast } from "@/hooks/use-toast"
import { Loading } from "@/components/ui/loading"
import { Empty } from "@/components/ui/empty"
import { formatDistanceToNow } from "date-fns"

// Define a subscriber type
interface Subscriber {
  id: string
  address: `0x${string}`
  subscriptionId: bigint
  planId: bigint
  startTime: bigint
  lastPaymentTime: bigint
  nextPaymentTime: bigint
  active: boolean
}

export default function SubscribersPage() {
  const { address } = useAccount()
  const [search, setSearch] = useState("")
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const { merchantPlans, getSubscriptionDetails, getPlanDetails, refetchMerchantPlans } = useSubPay()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0)

  // Memoize the fetch function to prevent recreating it on every render
  const fetchSubscribers = useCallback(async () => {
    if (!address || !merchantPlans) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("Fetching subscribers for merchant plans:", merchantPlans)

      const allSubscribers: Subscriber[] = []
      const checkedSubscriptions = new Set() // Track which subscriptions we've already checked

      // For each plan, we need to find all active subscriptions
      for (const planId of merchantPlans) {
        // Get plan details to check if it's active
        const plan = await getPlanDetails(planId)
        if (!plan || !plan.active) {
          continue
        }

        // Check a limited range of subscription IDs
        // This is more efficient than checking all possible IDs
        const startId = 1
        const maxChecks = 10 // Limit how many we check to avoid excessive calls

        for (let i = startId; i <= startId + maxChecks; i++) {
          try {
            const subscriptionId = BigInt(i)

            // Skip if we've already checked this subscription
            if (checkedSubscriptions.has(i)) continue
            checkedSubscriptions.add(i)

            const subscription = await getSubscriptionDetails(subscriptionId)

            // If this subscription is for our plan and is active
            if (
              subscription &&
              subscription.planId === planId &&
              subscription.active &&
              subscription.subscriber !== "0x0000000000000000000000000000000000000000"
            ) {
              console.log("Found subscriber:", subscription.subscriber)

              allSubscribers.push({
                id: `${subscription.subscriber}-${subscriptionId.toString()}`,
                address: subscription.subscriber,
                subscriptionId,
                planId,
                startTime: subscription.startTime,
                lastPaymentTime: subscription.lastPaymentTime,
                nextPaymentTime: subscription.nextPaymentTime,
                active: subscription.active,
              })
            }
          } catch (error) {
            // If we get an error for this ID, just continue to the next one
            console.log(`Error checking subscription ID ${i}, continuing...`)
          }
        }
      }

      console.log("All subscribers found:", allSubscribers)
      setSubscribers(allSubscribers)
    } catch (error) {
      console.error("Error fetching subscribers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch subscribers. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [address, merchantPlans, getPlanDetails, getSubscriptionDetails, toast])

  // Use a separate effect for the initial fetch
  useEffect(() => {
    if (address) {
      fetchSubscribers()
    }
  }, [address, fetchSubscribers, refreshKey])

  // Memoize filtered subscribers to prevent recalculation on every render
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => subscriber.address.toLowerCase().includes(search.toLowerCase()))
  }, [subscribers, search])

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refetchMerchantPlans()
    setRefreshKey((prev) => prev + 1)
  }, [refetchMerchantPlans])

  if (!address) {
    return (
      <DashboardLayout type="business">
        <Empty title="Connect Wallet" message="Please connect your wallet to view subscribers" />
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout type="business">
        <Loading size="lg" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout type="business">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscribers</h1>
            <p className="text-muted-foreground mt-1">Manage your subscription base</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md">
            <span className="text-sm font-medium">{subscribers.length} Total Subscribers</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subscriber address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleRefresh} variant="outline">
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subscribers.length === 0 ? (
              <Empty title="No Subscribers Found" message="You don't have any subscribers yet" />
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div>Subscriber</div>
                  <div>Subscription ID</div>
                  <div>Plan ID</div>
                  <div>Start Time</div>
                  <div>Next Payment</div>
                  <div>Status</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="grid grid-cols-6 gap-4 p-4 items-center text-sm">
                      <div className="font-mono truncate" title={subscriber.address}>
                        {subscriber.address.substring(0, 6)}...{subscriber.address.substring(38)}
                      </div>
                      <div>{subscriber.subscriptionId.toString()}</div>
                      <div>{subscriber.planId.toString()}</div>
                      <div>
                        {subscriber.startTime > 0
                          ? formatDistanceToNow(new Date(Number(subscriber.startTime) * 1000), { addSuffix: true })
                          : "N/A"}
                      </div>
                      <div>
                        {subscriber.nextPaymentTime > 0
                          ? formatDistanceToNow(new Date(Number(subscriber.nextPaymentTime) * 1000), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${subscriber.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {subscriber.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

