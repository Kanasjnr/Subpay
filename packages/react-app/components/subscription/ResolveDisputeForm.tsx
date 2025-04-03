"use client"

import type React from "react"

import { useState } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatEther } from "viem"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResolveDisputeFormProps {
  onSuccess?: () => void
}

export function ResolveDisputeForm({ onSuccess }: ResolveDisputeFormProps) {
  const { resolveSubscriptionDispute, isResolvingDispute, dispute, isArbitrator } = useSubPay()
  const { toast } = useToast()
  const [refundAmount, setRefundAmount] = useState("0")
  const [resolutionType, setResolutionType] = useState<string>("1") // Default to merchant wins
  const [notes, setNotes] = useState("")

  console.log("ResolveDisputeForm: Current dispute data:", dispute)
  console.log("ResolveDisputeForm: Is arbitrator:", isArbitrator)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("ResolveDisputeForm: Form submitted", {
      disputeId: dispute?.[0].toString(),
      resolutionType,
      refundAmount,
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

    if (!dispute) {
      console.log("ResolveDisputeForm: No active dispute")
      toast({
        title: "Error",
        description: "No active dispute found",
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
        disputeId: dispute[0].toString(),
        resolutionType: Number.parseInt(resolutionType),
        refundAmount,
        notes,
      })

      const result = await resolveSubscriptionDispute(dispute[0], Number.parseInt(resolutionType), refundAmount, notes)

      console.log("ResolveDisputeForm: Resolution result:", result)

      if (result) {
        toast({
          title: "Success",
          description: "Successfully resolved dispute!",
        })

        setRefundAmount("0")
        setResolutionType("1")
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

  if (!dispute) {
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

  // Destructure the dispute data
  const [
    id,
    subscriber,
    merchant,
    arbitrator,
    subscriptionId,
    refundAmountValue,
    createdAt,
    resolvedAt,
    resolutionTypeValue,
    resolutionNotes,
    reason,
    evidence,
    status,
    resolution,
  ] = dispute

  const maxRefundAmount = formatEther(refundAmountValue)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Dispute</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">Dispute ID:</span> {id.toString()}
          </div>
          <div>
            <span className="font-semibold">Subscriber:</span> {subscriber}
          </div>
          <div>
            <span className="font-semibold">Merchant:</span> {merchant}
          </div>
          <div>
            <span className="font-semibold">Amount:</span> {maxRefundAmount} CELO
          </div>
          <div>
            <span className="font-semibold">Reason:</span> {reason}
          </div>
          <div>
            <span className="font-semibold">Evidence:</span> {evidence}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            {status === 0
              ? "None"
              : status === 1
                ? "Opened"
                : status === 2
                  ? "Evidence Submitted"
                  : status === 3
                    ? "Resolved"
                    : status === 4
                      ? "Cancelled"
                      : "Unknown"}
          </div>
          <div>
            <span className="font-semibold">Created At:</span> {new Date(Number(createdAt) * 1000).toLocaleDateString()}
          </div>
          {resolvedAt > 0n && (
            <div>
              <span className="font-semibold">Resolved At:</span>{" "}
              {new Date(Number(resolvedAt) * 1000).toLocaleDateString()}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolutionType">Resolution Type</Label>
            <Select value={resolutionType} onValueChange={setResolutionType}>
              <SelectTrigger id="resolutionType">
                <SelectValue placeholder="Select resolution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Merchant Wins</SelectItem>
                <SelectItem value="2">Subscriber Wins</SelectItem>
                <SelectItem value="3">Compromise</SelectItem>
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
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
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

