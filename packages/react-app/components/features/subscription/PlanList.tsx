"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSubPay } from "@/hooks/useSubPay"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreatePlanForm } from "./CreatePlanForm"
import { Loading } from "@/components/ui/loading"
import { Empty } from "@/components/ui/empty"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: bigint
  merchant: `0x${string}`
  paymentToken: `0x${string}`
  amount: bigint
  frequency: bigint
  trialPeriod: bigint
  active: boolean
  metadata: string
}

interface PlanListProps {
  type: "business" | "subscriber"
}

export function PlanList({ type }: PlanListProps) {
  const [search, setSearch] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { address } = useAccount()
  const { toast } = useToast()
  const { 
    merchantPlans, 
    getAllPlans, 
    getPlanDetails, 
    subscribe: subscribeToPlan,
    isSubscribing,
    refetchMerchantPlans 
  } = useSubPay()
  const typeRef = useRef(type)
  const functionsRef = useRef({ merchantPlans, getAllPlans, getPlanDetails })
  const mountedRef = useRef(true)

  // Update refs when props change
  useEffect(() => {
    typeRef.current = type;
    functionsRef.current = { merchantPlans, getAllPlans, getPlanDetails };
  }, [type, merchantPlans, getAllPlans, getPlanDetails]);

  // Effect for fetching plans
  const fetchPlans = useCallback(async () => {
    if (!address || !mountedRef.current) {
      console.log('No address available or component unmounted, skipping plan fetch');
      return;
    }
    
    try {
      setLoading(true)
      console.log('Fetching plans for type:', typeRef.current);
      console.log('Current merchant plans:', functionsRef.current.merchantPlans);
      
      const planIds = typeRef.current === "business" 
        ? functionsRef.current.merchantPlans 
        : await functionsRef.current.getAllPlans();
      
      console.log('Retrieved plan IDs:', planIds);
      
      if (!planIds || planIds.length === 0) {
        console.log('No plan IDs found');
        if (mountedRef.current) {
          setPlans([])
          setLoading(false)
        }
        return
      }

      console.log('Fetching details for plans:', planIds);
      const planDetailsPromises = planIds.map(async (planId) => {
        try {
          console.log('Fetching details for plan:', planId.toString());
          const plan = await functionsRef.current.getPlanDetails(planId)
          if (!plan) {
            console.log('No details found for plan:', planId.toString());
            return null;
          }
          console.log('Found plan details:', plan);
          return {
            ...plan,
            id: planId
          } as Plan
        } catch (error) {
          console.error(`Error fetching details for plan ${planId}:`, error)
          return null
        }
      })

      const planDetails = await Promise.all(planDetailsPromises)
      if (!mountedRef.current) return

      console.log('All plan details:', planDetails);
      const validPlans = planDetails.filter((plan): plan is Plan => plan !== null)
      console.log('Valid plans:', validPlans);
      setPlans(validPlans)
    } catch (error) {
      console.error('Error fetching plans:', error)
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to fetch plans",
          variant: "destructive",
        })
        setPlans([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [address, toast]);

  useEffect(() => {
    fetchPlans();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPlans]);

  // Helper function to check if value is a bigint array
  const isBigIntArray = (value: unknown): value is bigint[] => {
    return Array.isArray(value) && value.every((item) => typeof item === "bigint")
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

  if (!address) {
    return <Empty title="Connect Wallet" message="Please connect your wallet to view plans" />
  }

  if (loading) {
    return <Loading size="lg" />
  }

  const filteredPlans = plans.filter(
    (plan) =>
      plan.metadata.toLowerCase().includes(search.toLowerCase()) ||
      plan.merchant.toLowerCase().includes(search.toLowerCase()),
  )

  if (filteredPlans.length === 0) {
    return (
      <Empty
        title={type === "business" ? "No Plans Created" : "No Plans Available"}
        message={
          type === "business"
            ? "You haven't created any subscription plans yet"
            : "There are no subscription plans available at the moment"
        }
        action={
          type === "business"
            ? {
                label: "Create Plan",
                onClick: () => setShowCreateModal(true),
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {type === "business" && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>Create Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subscription Plan</DialogTitle>
              </DialogHeader>
              <CreatePlanForm
                onSuccess={() => {
                  setShowCreateModal(false)
                  refetchMerchantPlans()
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card key={plan.id.toString()} className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle>{plan.metadata || (plan.id ? `Plan #${plan.id.toString()}` : "Unknown Plan")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{safeFormatEther(plan.amount)} cUSD</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Billing:</span>
                  <span className="font-medium">
                    Every {plan.frequency ? Number(plan.frequency) / 86400 : "N/A"} days
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Trial Period:</span>
                  <span className="font-medium">
                    {plan.trialPeriod && Number(plan.trialPeriod) > 0
                      ? `${Number(plan.trialPeriod) / 86400} days`
                      : "No trial"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${plan.active ? "text-green-500" : "text-red-500"}`}>
                    {plan.active ? "Active" : "Inactive"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Merchant: {plan.merchant ? `${plan.merchant.slice(0, 6)}...${plan.merchant.slice(-4)}` : "Unknown"}
                </p>
                {type === "subscriber" && plan.active && (
                  <Button
                    onClick={() => plan.id && subscribeToPlan(plan.id)}
                    disabled={isSubscribing || !plan.id}
                    className="w-full mt-4"
                  >
                    {isSubscribing ? "Subscribing..." : "Subscribe"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

