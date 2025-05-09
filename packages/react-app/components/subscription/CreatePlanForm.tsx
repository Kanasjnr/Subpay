"use client"

import type React from "react"

import { useState } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreatePlanFormProps {
  onSuccess?: () => void
}

// Use the CUSD_ADDRESS from environment variables
const CUSD_ADDRESS = process.env.NEXT_PUBLIC_CUSD_ADDRESS as `0x${string}`

if (!CUSD_ADDRESS) {
  throw new Error('CUSD_ADDRESS not found in environment variables')
}

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const { createPlan, isCreatingPlan } = useSubPay()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "30", // 30 days default
    trialPeriod: "0",
    metadata: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPlan(
        CUSD_ADDRESS,
        formData.amount,
        Number.parseInt(formData.frequency) * 86400, // Convert days to seconds
        Number.parseInt(formData.trialPeriod) * 86400, // Convert days to seconds
        formData.metadata || formData.name, // Use name as metadata if not provided
      )

      toast({
        title: "Success",
        description: "Plan created successfully",
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription plan",
        variant: "destructive",
      })
      console.error("Error creating plan:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Subscription Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Premium Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (cUSD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="10.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Billing Frequency (days)</Label>
            <Input
              id="frequency"
              type="number"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="30"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialPeriod">Trial Period (days)</Label>
            <Input
              id="trialPeriod"
              type="number"
              value={formData.trialPeriod}
              onChange={(e) => setFormData({ ...formData, trialPeriod: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Description</Label>
            <Input
              id="metadata"
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              placeholder="Plan description and details"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isCreatingPlan}>
            {isCreatingPlan ? "Creating Plan..." : "Create Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

