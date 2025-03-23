import { useSubPay } from '@/hooks/useSubPay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatEther } from 'viem'

export function ResolveDisputeForm() {
  const { resolveSubscriptionDispute, isResolvingDispute, dispute, isArbitrator } = useSubPay()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isArbitrator) {
      toast.error('Only arbitrators can resolve disputes')
      return
    }

    if (!dispute) {
      toast.error('No active dispute found')
      return
    }

    const formData = new FormData(e.currentTarget)
    const refundAmount = formData.get('refundAmount') as string
    const resolutionType = formData.get('resolutionType') as 'refund' | 'reject'
    const notes = formData.get('notes') as string

    try {
      await resolveSubscriptionDispute(dispute[0], resolutionType === 'refund' ? 1 : 0, refundAmount, notes)
      toast.success('Successfully resolved dispute!')
      e.currentTarget.reset()
    } catch (error) {
      toast.error('Failed to resolve dispute')
      console.error(error)
    }
  }

  if (!dispute) {
    return <div>No active disputes found.</div>
  }

  if (!isArbitrator) {
    return <div>Only arbitrators can resolve disputes.</div>
  }

  // Destructure the dispute data
  const [
    id,
    subscriber,
    merchant,
    arbitrator,
    subscriptionId,
    refundAmount,
    createdAt,
    resolvedAt,
    resolutionType,
    resolutionNotes,
    reason,
    evidence,
    status,
    resolution
  ] = dispute

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
            <span className="font-semibold">Amount:</span> {formatEther(refundAmount)} CELO
          </div>
          <div>
            <span className="font-semibold">Reason:</span> {reason}
          </div>
          <div>
            <span className="font-semibold">Evidence:</span> {evidence}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {status}
          </div>
          <div>
            <span className="font-semibold">Created At:</span> {new Date(Number(createdAt) * 1000).toLocaleDateString()}
          </div>
          {resolvedAt > 0n && (
            <div>
              <span className="font-semibold">Resolved At:</span> {new Date(Number(resolvedAt) * 1000).toLocaleDateString()}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolutionType">Resolution Type</Label>
            <select
              id="resolutionType"
              name="resolutionType"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            >
              <option value="refund">Refund</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount (CELO)</Label>
            <Input
              id="refundAmount"
              name="refundAmount"
              type="number"
              step="0.000000000000000001"
              min="0"
              max={formatEther(refundAmount)}
              required
            />
            <p className="text-sm text-gray-500">
              Maximum refund amount: {formatEther(refundAmount)} CELO
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Resolution Notes</Label>
            <Input
              id="notes"
              name="notes"
              type="text"
              required
              placeholder="Please provide notes about the resolution..."
            />
          </div>
          <Button type="submit" disabled={isResolvingDispute} className="w-full">
            {isResolvingDispute ? 'Resolving Dispute...' : 'Resolve Dispute'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 