"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { CreatePlanForm } from "@/components/features/subscription/CreatePlanForm"
import { PlanList } from "@/components/features/subscription/PlanList"
import { useSubPay } from "@/hooks/useSubPay"

export default function PlansPage() {
  const { address } = useAccount()
  const { refetchMerchantPlans } = useSubPay()
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePlanCreated = () => {
    refetchMerchantPlans()
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <DashboardLayout type="business">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground mt-1">Create and manage your subscription plans</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <CreatePlanForm onSuccess={handlePlanCreated} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Your Plans</h2>
              <PlanList type="business" key={refreshKey} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

