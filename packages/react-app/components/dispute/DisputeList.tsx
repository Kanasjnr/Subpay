'use client';

import { useState, useEffect } from "react"
import { Search, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useSubPay } from "@/hooks/useSubPay"
import { Empty } from "@/components/ui/empty"
import { Loading } from "@/components/ui/loading"

interface DisputeListProps {
  type: "business" | "subscriber"
}

export function DisputeList({ type }: DisputeListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { getDispute } = useSubPay()

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true)
        // In a real implementation, we would fetch disputes from the contract
        // For now, we'll use mock data
        const mockDisputes = [
          {
            id: 1,
            subscriber: "0x1234...5678",
            plan: "Premium Music",
            amount: "10 cUSD",
            reason: "Service not received",
            status: "Open",
            date: "2023-06-15",
            evidence: "No access to premium features despite payment",
          },
          {
            id: 2,
            subscriber: "0x8765...4321",
            plan: "News Plus",
            amount: "5 cUSD",
            reason: "Unauthorized charge",
            status: "In Progress",
            date: "2023-06-10",
            evidence: "I never authorized this subscription",
          },
        ]

        setDisputes(mockDisputes)
      } catch (error) {
        console.error("Error fetching disputes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [])

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch = dispute.subscriber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <Loading size="lg" />
  }

  if (!disputes.length) {
    return (
      <Empty
        title="No Disputes Found"
        message={type === "business" ? "You have no active disputes" : "You haven't opened any disputes"}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            {disputes.filter((d) => d.status === "Open").length} Open Disputes
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subscriber address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 text-sm font-medium">
              <div>Subscriber</div>
              <div>Plan</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Date</div>
              <div>Reason</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {filteredDisputes.map((dispute) => (
                <div key={dispute.id} className="grid grid-cols-7 gap-4 p-4 items-center text-sm">
                  <div className="font-mono">{dispute.subscriber}</div>
                  <div>{dispute.plan}</div>
                  <div>{dispute.amount}</div>
                  <div>
                    <span className={`status-badge ${dispute.status.toLowerCase().replace(" ", "-")}`}>
                      {dispute.status}
                    </span>
                  </div>
                  <div>{dispute.date}</div>
                  <div className="truncate" title={dispute.reason}>
                    {dispute.reason}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                    <Button variant="destructive" size="sm">
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 