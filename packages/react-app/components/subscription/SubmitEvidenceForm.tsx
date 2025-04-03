"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
  const dataFetchedRef = useRef(false)

  // Fetch dispute details when the component mounts
  useEffect(() => {
    const fetchDispute = async () => {
      // Prevent multiple fetches
      if (dataFetchedRef.current) return

      console.log("SubmitEvidenceForm: Fetching dispute details for ID:", disputeId.toString())
      try {
        setLoading(true)
        const disputeData = await getDispute(disputeId)
        console.log("SubmitEvidenceForm: Dispute data received:", disputeData)
        setDispute(disputeData)
        dataFetchedRef.current = true
      } catch (error) {
        console.error("SubmitEvidenceForm: Error fetching dispute:", error)
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

  // Add console log to handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("SubmitEvidenceForm: Form submitted with evidence:", evidence)

    if (!evidence) {
      console.log("SubmitEvidenceForm: Missing evidence")
      toast({
        title: "Error",
        description: "Please provide evidence for your dispute",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("SubmitEvidenceForm: Submitting evidence for dispute ID:", disputeId.toString())
      const result = await submitEvidence(disputeId, evidence)
      console.log("SubmitEvidenceForm: Evidence submission result:", result)

      if (result) {
        toast({
          title: "Success",
          description: "Evidence submitted successfully",
        })

        onSuccess?.()
      }
    } catch (error) {
      console.error("SubmitEvidenceForm: Error submitting evidence:", error)
      toast({
        title: "Error",
        description: "Failed to submit evidence",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading dispute details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dispute) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Dispute not found or could not be loaded.</div>
        </CardContent>
      </Card>
    )
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

