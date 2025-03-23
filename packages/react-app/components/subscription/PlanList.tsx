"use client"

import { useState, useEffect } from "react"
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

interface PlanListProps {
  type: "business" | "subscriber"
}

export function PlanList({ type }: PlanListProps) {
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { address } = useAccount()
  const { toast } = useToast()
  const { merchantPlans, getPlanDetails, subscribe, isSubscribing, refetchMerchantPlans, getAllPlans } = useSubPay()

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

  // Effect for fetching plan details
  useEffect(() => {
    let mounted = true

    const fetchPlans = async () => {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        let planIds: bigint[] = []

        if (type === "business") {
          if (!merchantPlans) {
            if (mounted) {
              setPlans([])
              setLoading(false)
            }
            return
          }
          planIds = Array.from(merchantPlans)
        } else {
          const allPlans = await getAllPlans(20)
          if (!allPlans || !mounted) {
            if (mounted) {
              setPlans([])
              setLoading(false)
            }
            return
          }
          planIds = allPlans // Already filtered for valid plans
        }

        if (!isBigIntArray(planIds) || planIds.length === 0) {
          if (mounted) {
            setPlans([])
            setLoading(false)
          }
          return
        }

        const details = await Promise.all(
          planIds.map(async (id) => {
            try {
              const plan = await getPlanDetails(id)
              if (!plan) return null

              return {
                id,
                merchant: plan.merchant,
                paymentToken: plan.paymentToken,
                amount: plan.amount,
                frequency: plan.frequency,
                trialPeriod: plan.trialPeriod,
                active: plan.active,
                metadata: plan.metadata || `Plan #${id.toString()}`,
              }
            } catch (err) {
              console.error(`Error fetching plan ${id.toString()}:`, err)
              return null
            }
          }),
        )

        if (mounted) {
          const validPlans = details.filter((plan): plan is any => plan !== null)
          setPlans(validPlans)
        }
      } catch (error) {
        console.error("Error fetching plans:", error)
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to fetch plans. Please try again later.",
            variant: "destructive",
          })
          setPlans([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchPlans()

    return () => {
      mounted = false
    }
  }, [address, type, merchantPlans])

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
          <Card key={plan.id ? plan.id.toString() : "unknown"} className="hover:border-primary transition-colors">
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
                    onClick={() => plan.id && subscribe(plan.id)}
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

