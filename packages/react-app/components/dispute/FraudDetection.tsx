"use client"

import { useState, useEffect } from "react"
import { useSubPay } from "@/hooks/useSubPay"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle2, Info, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAccount } from "wagmi"

interface FraudRisk {
  score: number
  reasons: string[]
  recommendations: string[]
  aiPrediction?: {
    isFraudulent: boolean
    confidence: number
    features: number[]
  }
  detailedAnalysis?: {
    transactionHistory: {
      frequency: number
      amountPatterns: {
        average: number
        variance: number
        max: number
      }
      timePatterns: {
        regular: boolean
        intervals: number[]
      }
    }
    subscriptionPatterns: {
      cancellations: number
      disputes: number
      failedPayments: number
    }
  }
}

export function FraudDetection() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [fraudRisk, setFraudRisk] = useState<FraudRisk | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (address) {
      analyzeFraudRisk()
    }
  }, [address])

  const analyzeFraudRisk = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analyze-fraud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze fraud risk')
      }

      const data = await response.json()
      setFraudRisk(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze fraud risk",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return "bg-green-500"
    if (score < 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getRiskIcon = (score: number) => {
    if (score < 30) return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (score < 70) return <Info className="h-5 w-5 text-yellow-500" />
    return <AlertTriangle className="h-5 w-5 text-red-500" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fraud Risk Analysis</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fraudRisk ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Risk Score</span>
                {getRiskIcon(fraudRisk.score)}
              </div>
              <Badge className={getRiskColor(fraudRisk.score)}>
                {fraudRisk.score}%
              </Badge>
            </div>
            <Progress value={fraudRisk.score} className="h-2" />

            {/* AI Prediction Section */}
            {fraudRisk.aiPrediction && (
              <div className="mt-4 p-4 border rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">AI Prediction</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">Status:</p>
                    <Badge variant={fraudRisk.aiPrediction.isFraudulent ? "destructive" : "default"}>
                      {fraudRisk.aiPrediction.isFraudulent ? "Suspicious" : "Normal"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm">Confidence:</p>
                    <Progress value={fraudRisk.aiPrediction.confidence * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(fraudRisk.aiPrediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">Risk Factors</h4>
              <ul className="list-disc pl-4 space-y-1">
                {fraudRisk.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Recommendations</h4>
              <ul className="list-disc pl-4 space-y-1">
                {fraudRisk.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            {showDetails && fraudRisk.detailedAnalysis && (
              <Collapsible>
                <CollapsibleTrigger className="text-sm font-medium text-muted-foreground">
                  Detailed Analysis
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Transaction History</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>Frequency: {fraudRisk.detailedAnalysis.transactionHistory.frequency}</p>
                        <p>Average Amount: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.average.toFixed(2)}</p>
                        <p>Max Amount: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.max.toFixed(2)}</p>
                      </div>
                      <div>
                        <p>Regular Pattern: {fraudRisk.detailedAnalysis.transactionHistory.timePatterns.regular ? "Yes" : "No"}</p>
                        <p>Variance: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.variance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Subscription Patterns</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <p>Cancellations: {fraudRisk.detailedAnalysis.subscriptionPatterns.cancellations}</p>
                      <p>Disputes: {fraudRisk.detailedAnalysis.subscriptionPatterns.disputes}</p>
                      <p>Failed Payments: {fraudRisk.detailedAnalysis.subscriptionPatterns.failedPayments}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No fraud risk analysis available
          </p>
        )}
      </CardContent>
    </Card>
  )
} 