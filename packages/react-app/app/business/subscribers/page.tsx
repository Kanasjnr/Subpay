"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
import { formatDistanceToNow } from 'date-fns'

// Define a subscriber type
interface Subscriber {
  id: string
  address: `0x${string}`
  subscriptionId: bigint
  planId: bigint
  planName: string
  startTime: bigint
  lastPaymentTime: bigint
  nextPaymentTime: bigint
  active: boolean
}

export default function SubscribersPage() {
  const { address } = useAccount()
  const { merchantPlans, getPlanDetails, getAllSubscribers } = useSubPay()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const hasInitialized = useRef(false)
  const { toast } = useToast()

  const fetchSubscribers = useCallback(async () => {
    if (!address) {
      console.error('No address available');
      return;
    }
    if (hasInitialized.current) {
      console.log('Already initialized, skipping fetch');
      return;
    }

    try {
      setLoading(true)
      console.log("Starting to fetch all subscribers for merchant:", address)

      // Use getAllSubscribers to get all subscribers at once
      const subscriptions = await getAllSubscribers(address)
      console.log('Raw subscriptions data:', subscriptions);

      const allSubscribers: Subscriber[] = []
      for (const subscription of subscriptions) {
        // Get plan details for each subscription
        const plan = await getPlanDetails(subscription.planId)
        if (!plan) {
          console.log('Plan not found for subscription:', subscription.planId.toString());
          continue;
        }

        // Create a unique ID for each subscription
        const subscriptionId = subscription.planId // Use planId as subscriptionId for now
        const id = `${subscriptionId}-${subscription.subscriber}`

        console.log('Processing subscription:', {
          id,
          subscriptionId: subscriptionId.toString(),
          subscriber: subscription.subscriber,
          planId: subscription.planId.toString(),
          planName: plan.metadata,
          active: subscription.active
        });

        allSubscribers.push({
          id,
          address: subscription.subscriber,
          subscriptionId,
          planId: subscription.planId,
          planName: plan.metadata || `Plan #${subscription.planId.toString()}`,
          startTime: subscription.startTime,
          lastPaymentTime: subscription.lastPaymentTime,
          nextPaymentTime: subscription.nextPaymentTime,
          active: subscription.active
        })
      }

      console.log('Total subscribers processed:', allSubscribers.length);
      console.log('Final subscribers array:', allSubscribers);
      setSubscribers(allSubscribers)
      hasInitialized.current = true
    } catch (error) {
      console.error("Error in fetchSubscribers:", error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      toast({
        title: "Error",
        description: "Failed to fetch subscribers. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [address, getAllSubscribers, getPlanDetails])

  // Initial fetch
  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  // Reset initialization when merchant plans change
  useEffect(() => {
    if (merchantPlans) {
      hasInitialized.current = false
    }
  }, [merchantPlans])

  // Memoize filtered subscribers to prevent recalculation on every render
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => subscriber.address.toLowerCase().includes(search.toLowerCase()))
  }, [subscribers, search])

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
                  <div>Plan Name</div>
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
                      <div className="truncate" title={subscriber.planName}>{subscriber.planName}</div>
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