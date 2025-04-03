"use client"

import type React from "react"
import { useState } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface OpenDisputeFormProps {
  subscriptionId: bigint
  onSuccess?: () => void
  onCancel?: () => void
}

export function OpenDisputeForm({ subscriptionId, onSuccess, onCancel }: OpenDisputeFormProps) {
  const { openDispute, isOpeningDispute } = useSubPay()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
  })

  const disputeReasons = [
    "Service not provided",
    "Service quality issues",
    "Unauthorized charge",
    "Incorrect amount",
    "Other",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("OpenDisputeForm: Form submitted", { subscriptionId: subscriptionId.toString(), formData })

    if (!formData.reason) {
      console.log("OpenDisputeForm: Missing reason")
      toast({
        title: "Error",
        description: "Please select a reason for the dispute",
        variant: "destructive",
      })
      return
    }

    if (!formData.description) {
      console.log("OpenDisputeForm: Missing description")
      toast({
        title: "Error",
        description: "Please provide details about your dispute",
        variant: "destructive",
      })
      return
    }

    try {
      // Combine reason and description for the dispute reason
      const fullReason = `${formData.reason}: ${formData.description}`
      console.log("OpenDisputeForm: Opening dispute with reason:", fullReason)

      const result = await openDispute(subscriptionId, fullReason)
      console.log("OpenDisputeForm: Dispute opened result:", result)

      if (result) {
        toast({
          title: "Success",
          description: "Dispute opened successfully",
        })

        onSuccess?.()
      }
    } catch (error) {
      console.error("OpenDisputeForm: Error opening dispute:", error)
      toast({
        title: "Error",
        description: "Failed to open dispute",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Dispute</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value }))}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {disputeReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide details about your dispute..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isOpeningDispute}>
              {isOpeningDispute ? "Submitting..." : "Submit Dispute"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

