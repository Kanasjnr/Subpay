"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, TrendingDown, Coins } from "lucide-react"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { AnalyticsCharts } from "@/components/business/AnalyticsCharts"
import { formatEther } from "viem"
import { CreatePlanModal } from "@/components/business/CreatePlanModal"
import { Error } from "@/components/ui/error"
import { Empty } from "@/components/ui/empty"
import { useSubPay } from "@/hooks/useSubPay"

// Helper function to safely format ether values
const safeFormatEther = (value: bigint | undefined) => {
  if (value === undefined) {
    return "0"
  }
  try {
    return formatEther(value)
  } catch (error) {
    console.error("Error formatting ether value:", error)
    return "0"
  }
}

export default function BusinessDashboard() {
  const { address } = useAccount()
  const router = useRouter()
  const { merchantPlans, getPlanDetails } = useSubPay()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Memoize the fetch function to prevent recreating it on every render
  const fetchPlans = useCallback(async () => {
    if (!address || !merchantPlans) {
      setPlans([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (merchantPlans.length === 0) {
        setPlans([])
        setLoading(false)
        return
      }

      // Create a map to track which plans we've already processed
      const processedPlans = new Map()
      const planPromises = []

      for (const planId of merchantPlans) {
        // Skip if we've already processed this plan
        if (processedPlans.has(planId.toString())) continue
        processedPlans.set(planId.toString(), true)

        // Add the promise to our array
        planPromises.push(
          getPlanDetails(planId)
            .then((plan) => {
              if (!plan) return null

              return {
                id: planId,
                merchant: plan.merchant,
                paymentToken: plan.paymentToken,
                amount: plan.amount,
                frequency: plan.frequency,
                trialPeriod: plan.trialPeriod,
                active: plan.active,
                metadata: plan.metadata || `Plan #${planId.toString()}`,
              }
            })
            .catch((err) => {
              console.error(`Error fetching plan ${planId.toString()}:`, err)
              return null
            }),
        )
      }

      // Wait for all promises to resolve
      const planDetails = await Promise.all(planPromises)
      const validPlans = planDetails.filter((plan): plan is any => plan !== null)

      setPlans(validPlans)
    } catch (error) {
      console.error("Error fetching plans:", error)
      setError("Failed to load subscription plans. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [address, merchantPlans, getPlanDetails])

  // Use a separate effect for the initial fetch
  useEffect(() => {
    if (address) {
      fetchPlans()
    } else {
      router.push("/")
    }
  }, [address, router, fetchPlans, refreshKey])

  // Memoize calculated values
  const stats = useMemo(() => {
    // Calculate stats safely
    const monthlyRevenue = plans.reduce((acc, plan) => {
      if (!plan.amount) return acc
      try {
        return acc + Number(safeFormatEther(plan.amount))
      } catch (error) {
        return acc
      }
    }, 0)

    const activePlans = plans.filter((p) => p.active).length
    const totalPlans = plans.length

    return {
      monthlyRevenue,
      activePlans,
      totalPlans,
    }
  }, [plans])

  const handleCreatePlan = () => {
    setIsCreateModalOpen(true)
  }

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (!address) return null

  if (loading) {
    return (
      <DashboardLayout type="business">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your plans...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout type="business">
        <Error
          className="h-[calc(100vh-4rem)]"
          title="Failed to load plans"
          message={error}
          onRetry={() => setRefreshKey((prev) => prev + 1)}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout type="business">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your subscription business</p>
          </div>
          <Button onClick={handleCreatePlan} className="bg-primary hover:bg-primary/90">
            + New Plan
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.monthlyRevenue.toFixed(2)} cUSD</h3>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  12%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Active Plans</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.activePlans}</h3>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  8%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.totalPlans}</h3>
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  5%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <h3 className="text-2xl font-bold mt-2">3.2%</h3>
                </div>
                <div className="flex items-center text-red-500 text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  2%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts />

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-3">
              <Empty
                title="No subscription plans"
                message="Create your first subscription plan to start earning recurring revenue."
                action={{
                  label: "Create Plan",
                  onClick: handleCreatePlan,
                }}
                icon={<Coins className="h-12 w-12 text-muted-foreground" />}
              />
            </div>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id ? plan.id.toString() : "unknown"} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {plan.metadata || (plan.id ? `Plan #${plan.id.toString()}` : "Unknown Plan")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.active ? "Active subscription plan" : "Inactive plan"}
                      </p>
                    </div>
                    <span className={`status-badge ${plan.active ? "success" : "error"}`}>
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">{safeFormatEther(plan.amount)} cUSD</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Billing</p>
                      <p className="font-medium">
                        Every {plan.frequency ? Number(plan.frequency) / 86400 : "N/A"} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trial Period</p>
                      <p className="font-medium">
                        {plan.trialPeriod && Number(plan.trialPeriod) > 0
                          ? `${Number(plan.trialPeriod) / 86400} days`
                          : "No trial"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Token</p>
                      <p className="font-medium truncate" title={plan.paymentToken}>
                        {plan.paymentToken
                          ? `${plan.paymentToken.slice(0, 6)}...${plan.paymentToken.slice(-4)}`
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" disabled={!plan.active}>
                      Deactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </DashboardLayout>
  )
}

