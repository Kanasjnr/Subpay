"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatEther } from "viem"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DisputeData } from "@/app/subscriber/disputes/page"

// Add Resolution enum
enum Resolution {
  None = "0",
  MerchantWins = "1",
  SubscriberWins = "2",
  Compromise = "3"
}

interface ResolveDisputeFormProps {
  onSuccess?: () => void
  disputeData?: DisputeData
}

export function ResolveDisputeForm({ onSuccess, disputeData }: ResolveDisputeFormProps) {
  const { resolveSubscriptionDispute, isResolvingDispute, isArbitrator } = useSubPay()
  const { toast } = useToast()

  const [resolutionType, setResolutionType] = useState<Resolution>(Resolution.None)
  const [refundAmountValue, setRefundAmountValue] = useState<string>("0")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update state when dispute changes
  useEffect(() => {
    if (disputeData) {
      setRefundAmountValue(disputeData.refundAmount ? formatEther(disputeData.refundAmount) : "0")
      setNotes(disputeData.resolutionNotes || "")
    }
  }, [disputeData])

  console.log("ResolveDisputeForm: Current dispute data:", disputeData)
  console.log("ResolveDisputeForm: Is arbitrator:", isArbitrator)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeData) {
      toast({
        title: "Error",
        description: "No dispute data available",
        variant: "destructive",
      })
      return
    }

    console.log("ResolveDisputeForm: Form submitted", {
      disputeId: disputeData.id.toString(),
      resolutionType,
      refundAmount: refundAmountValue,
      notes,
    })

    if (!isArbitrator) {
      console.log("ResolveDisputeForm: Not an arbitrator")
      toast({
        title: "Error",
        description: "Only arbitrators can resolve disputes",
        variant: "destructive",
      })
      return
    }

    if (!notes) {
      console.log("ResolveDisputeForm: Missing notes")
      toast({
        title: "Error",
        description: "Please provide resolution notes",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("ResolveDisputeForm: Resolving dispute", {
        disputeId: disputeData.id.toString(),
        resolutionType: Number.parseInt(resolutionType),
        refundAmount: refundAmountValue,
        notes,
      })

      const result = await resolveSubscriptionDispute(
        disputeData.id,
        Number.parseInt(resolutionType),
        refundAmountValue,
        notes
      )

      console.log("ResolveDisputeForm: Resolution result:", result)

      if (result) {
        toast({
          title: "Success",
          description: "Successfully resolved dispute!",
        })

        setRefundAmountValue("0")
        setResolutionType(Resolution.None)
        setNotes("")

        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error("ResolveDisputeForm: Error resolving dispute:", error)
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      })
    }
  }

  if (!disputeData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">No active disputes found.</div>
        </CardContent>
      </Card>
    )
  }

  if (!isArbitrator) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Only arbitrators can resolve disputes.</div>
        </CardContent>
      </Card>
    )
  }

  const maxRefundAmount = formatEther(disputeData.refundAmount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Dispute</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">Dispute ID:</span> {disputeData.id.toString()}
          </div>
          <div>
            <span className="font-semibold">Subscriber:</span> {disputeData.subscriber}
          </div>
          <div>
            <span className="font-semibold">Merchant:</span> {disputeData.merchant}
          </div>
          <div>
            <span className="font-semibold">Amount:</span> {maxRefundAmount} CELO
          </div>
          <div>
            <span className="font-semibold">Reason:</span> {disputeData.reason}
          </div>
          <div>
            <span className="font-semibold">Evidence:</span> {disputeData.merchantEvidence || disputeData.subscriberEvidence}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            {disputeData.status === 0
              ? "None"
              : disputeData.status === 1
                ? "Opened"
                : disputeData.status === 2
                  ? "Evidence Submitted"
                  : disputeData.status === 3
                    ? "Resolved"
                    : disputeData.status === 4
                      ? "Cancelled"
                      : "Unknown"}
          </div>
          <div>
            <span className="font-semibold">Created At:</span>{" "}
            {new Date(Number(disputeData.createdAt) * 1000).toLocaleDateString()}
          </div>
          {disputeData.resolvedAt > 0n && (
            <div>
              <span className="font-semibold">Resolved At:</span>{" "}
              {new Date(Number(disputeData.resolvedAt) * 1000).toLocaleDateString()}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolutionType">Resolution Type</Label>
            <Select
              value={resolutionType}
              onValueChange={(value) => setResolutionType(value as Resolution)}
            >
              <SelectTrigger id="resolutionType">
                <SelectValue placeholder="Select resolution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Resolution.MerchantWins}>Merchant Wins</SelectItem>
                <SelectItem value={Resolution.SubscriberWins}>Subscriber Wins</SelectItem>
                <SelectItem value={Resolution.Compromise}>Compromise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount (CELO)</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.000000000000000001"
              min="0"
              max={maxRefundAmount}
              value={refundAmountValue}
              onChange={(e) => setRefundAmountValue(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">Maximum refund amount: {maxRefundAmount} CELO</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Resolution Notes</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              placeholder="Please provide notes about the resolution..."
            />
          </div>
          <Button type="submit" disabled={isResolvingDispute} className="w-full">
            {isResolvingDispute ? "Resolving Dispute..." : "Resolve Dispute"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

