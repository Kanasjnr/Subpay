"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface SubmitEvidenceFormProps {
  disputeId: bigint
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubmitEvidenceForm({ disputeId, onSuccess, onCancel }: SubmitEvidenceFormProps) {
  const { submitEvidence, isSubmittingEvidence, getDispute } = useSubPay()
  const { toast } = useToast()
  const [evidence, setEvidence] = useState("")
  const [loading, setLoading] = useState(false)
  const [dispute, setDispute] = useState<any>(null)

  // Fetch dispute details when the component mounts
  useEffect(() => {
    const fetchDispute = async () => {
      console.log("Fetching dispute details for ID:", disputeId.toString())
      try {
        setLoading(true)
        const disputeData = await getDispute(disputeId)
        console.log("Dispute data:", disputeData)
        setDispute(disputeData)
      } catch (error) {
        console.error("Error fetching dispute:", error)
        toast({
          title: "Error",
          description: "Failed to fetch dispute details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDispute()
  }, [disputeId, getDispute, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!evidence) {
      toast({
        title: "Error",
        description: "Please provide evidence for your dispute",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Submitting evidence for dispute ID:", disputeId.toString())
      console.log("Evidence:", evidence)
      await submitEvidence(disputeId, evidence)

      toast({
        title: "Success",
        description: "Evidence submitted successfully",
      })

      onSuccess?.()
    } catch (error) {
      console.error("Error submitting evidence:", error)
      toast({
        title: "Error",
        description: "Failed to submit evidence",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dispute details...</p>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return <div className="text-center py-8">Dispute not found or could not be loaded.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <span className="font-semibold">Dispute ID:</span> {disputeId.toString()}
          </div>
          {dispute.reason && (
            <div>
              <span className="font-semibold">Reason:</span> {dispute.reason}
            </div>
          )}
          {dispute.status !== undefined && (
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {dispute.status === 1
                ? "Open"
                : dispute.status === 2
                  ? "Evidence Submitted"
                  : dispute.status === 3
                    ? "Resolved"
                    : dispute.status === 4
                      ? "Cancelled"
                      : "Unknown"}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evidence">Your Evidence</Label>
            <Textarea
              id="evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Provide evidence to support your case..."
              rows={4}
              required
            />
            <p className="text-sm text-muted-foreground">
              Provide clear and concise evidence to support your position in this dispute.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isSubmittingEvidence}>
              {isSubmittingEvidence ? "Submitting..." : "Submit Evidence"}
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

