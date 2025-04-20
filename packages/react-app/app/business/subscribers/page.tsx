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
  planId: bigint
  planName: string
  active: boolean
}

export default function SubscribersPage() {
  const { address } = useAccount()
  const { merchantPlans, getPlanDetails, getMerchantSubscribers } = useSubPay()
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

      // Use getMerchantSubscribers to get all subscribers for this merchant
      const subscriberAddresses = await getMerchantSubscribers(address)
      console.log('Raw subscriber addresses:', subscriberAddresses);

      if (!subscriberAddresses || subscriberAddresses.length === 0) {
        console.log('No subscribers found for merchant');
        setSubscribers([]);
        return;
      }

      const allSubscribers: Subscriber[] = []
      for (const subscriberAddress of subscriberAddresses) {
        // Get merchant plans to find which plan this subscriber is on
        const plans = merchantPlans || []
        for (const planId of plans) {
          try {
            const plan = await getPlanDetails(planId)
            if (!plan) {
              console.log('Plan not found:', planId.toString());
              continue;
            }

            // Create a unique ID for this subscriber-plan combination
            const id = `${planId}-${subscriberAddress}`

            console.log('Processing subscriber:', {
              id,
              address: subscriberAddress,
              planId: planId.toString(),
              planName: plan.metadata,
              active: plan.active
            });

            allSubscribers.push({
              id,
              address: subscriberAddress,
              planId,
              planName: plan.metadata || `Plan #${planId.toString()}`,
              active: plan.active
            })
          } catch (error) {
            console.error(`Error processing plan ${planId}:`, error);
            continue;
          }
        }
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
  }, [address, getMerchantSubscribers, getPlanDetails, merchantPlans])

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
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div>Subscriber</div>
                  <div>Plan ID</div>
                  <div>Plan Name</div>
                  <div>Status</div>
                </div>
                <div className="divide-y divide-border">
                  {filteredSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="grid grid-cols-4 gap-4 p-4 items-center text-sm">
                      <div className="font-mono truncate" title={subscriber.address}>
                        {subscriber.address.substring(0, 6)}...{subscriber.address.substring(38)}
                      </div>
                      <div>{subscriber.planId.toString()}</div>
                      <div className="truncate" title={subscriber.planName}>{subscriber.planName}</div>
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