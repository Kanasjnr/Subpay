"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSubPay } from "@/hooks/useSubPay"
import { useToast } from "@/hooks/use-toast"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreatePlanModal({ isOpen, onClose, onSuccess }: CreatePlanModalProps) {
  const { createPlan, isCreatingPlan } = useSubPay()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    frequency: "30", // Default to 30 days
    trialPeriod: "0", // Default to no trial
    metadata: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Use the CUSD token address as default payment token
      const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as `0x${string}`

      await createPlan(
        CUSD_ADDRESS,
        formData.amount,
        Number(formData.frequency) * 86400, // Convert days to seconds
        Number(formData.trialPeriod) * 86400, // Convert days to seconds
        formData.metadata || formData.name, // Use name as metadata if not provided
      )

      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating plan:", error)
      toast({
        title: "Error",
        description: "Failed to create subscription plan",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Subscription Plan</DialogTitle>
          <DialogDescription>Set up a new subscription plan for your service.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Premium Plan"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (cUSD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="10.00"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Billing Frequency (days)</Label>
            <Input
              id="frequency"
              name="frequency"
              type="number"
              min="1"
              placeholder="30"
              value={formData.frequency}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trialPeriod">Trial Period (days)</Label>
            <Input
              id="trialPeriod"
              name="trialPeriod"
              type="number"
              min="0"
              placeholder="0"
              value={formData.trialPeriod}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadata">Description</Label>
            <Input
              id="metadata"
              name="metadata"
              placeholder="Premium features and benefits"
              value={formData.metadata}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingPlan}>
              {isCreatingPlan ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

