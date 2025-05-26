"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, TrendingDown, Coins } from "lucide-react"
import DashboardLayout from "@/components/Layout/DashboardLayout"
import { AnalyticsCharts } from "@/components/business/AnalyticsCharts"
import { RiskAssessment } from "@/components/features/risk/RiskAssessment"
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
  const [stats, setStats] = useState({ monthlyRevenue: 0, activePlans: 0, totalPlans: 0 })
  const [loading, setLoading] = useState(true)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }
  }, [address, router]);

  const calculateStats = useCallback(async () => {
    if (!merchantPlans || hasInitialized.current) {
      return
    }

    try {
      setLoading(true)
      const planDetails = await Promise.all(
        merchantPlans.map(id => getPlanDetails(id))
      )

      const validPlans = planDetails.filter((plan): plan is NonNullable<typeof plan> => plan !== undefined)
      
      const monthlyRevenue = validPlans.reduce((acc, plan) => {
        if (!plan.amount || !plan.active) return acc
        try {
          return acc + Number(formatEther(plan.amount))
        } catch (error) {
          return acc
        }
      }, 0)

      setStats({
        monthlyRevenue,
        activePlans: validPlans.filter(p => p.active).length,
        totalPlans: validPlans.length
      })
      hasInitialized.current = true
    } catch (error) {
      console.error("Error calculating stats:", error)
    } finally {
      setLoading(false)
    }
  }, [merchantPlans, getPlanDetails]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Reset initialization when merchant plans change
  useEffect(() => {
    if (merchantPlans) {
      hasInitialized.current = false
    }
  }, [merchantPlans]);

  if (!address) return null

  if (loading) {
    return (
      <DashboardLayout type="business">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
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
          <Button onClick={() => router.push('/business/plans')} className="bg-primary hover:bg-primary/90">
            Manage Plans
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

        {/* Risk Assessment */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Risk Assessment</h2>
            <RiskAssessment address={address} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

