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
import { formatEther } from "viem"

// Add Subscription type
interface Subscription {
  id: bigint
  active: boolean
}

interface PaymentRecord {
  amount: bigint
  timestamp: bigint
  success: boolean
  subscriptionId: bigint
}

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
  const subPay = useSubPay()
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
      
      // Get AI data from the hook
      const [creditScore, paymentHistory, highRiskSubs] = await Promise.all([
        subPay.getCreditScore(address as `0x${string}`),
        subPay.getPaymentHistory(address as `0x${string}`, 10),
        subPay.getHighRiskSubscriptions(10)
      ])

      console.log('Payment History:', paymentHistory)
      console.log('Credit Score:', creditScore)
      console.log('High Risk Subs:', highRiskSubs)

      // Get subscription details
      const subscriptions = subPay.subscriberSubscriptions?.map(sub => ({
        id: sub,
        active: true // Assuming all subscriptions are active by default
      })) || []
      
      const cancellations = subscriptions.filter(sub => !sub.active).length
      const disputes = await getDisputeCount(subscriptions)

      // Calculate risk factors
      const riskScore = calculateRiskScore(creditScore, paymentHistory, highRiskSubs)
      const reasons = generateRiskReasons(creditScore, paymentHistory, highRiskSubs)
      const recommendations = generateRecommendations(riskScore)

      // Get detailed analysis
      const detailedAnalysis = await getDetailedAnalysis(paymentHistory, cancellations, disputes)

      setFraudRisk({
        score: riskScore,
        reasons,
        recommendations,
        aiPrediction: {
          isFraudulent: riskScore > 70,
          confidence: riskScore / 100,
          features: [
            paymentHistory?.length || 0,
            Number(calculateAverageAmount(paymentHistory)),
            Number(calculateVariance(paymentHistory)),
            Number(findMaxAmount(paymentHistory)),
            checkRegularity(paymentHistory) ? 1 : 0
          ]
        },
        detailedAnalysis
      })
    } catch (error) {
      console.error('Error analyzing fraud risk:', error)
      toast({
        title: "Error",
        description: "Failed to analyze fraud risk",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get dispute count
  async function getDisputeCount(subscriptions: Subscription[]): Promise<number> {
    if (!subscriptions.length) return 0
    let disputeCount = 0
    for (const sub of subscriptions) {
      try {
        const dispute = await subPay.getDispute(sub.id)
        if (dispute && dispute.status !== 0) { // Status 0 is None
          disputeCount++
        }
      } catch (error) {
        console.error('Error fetching dispute details:', error)
        continue
      }
    }
    return disputeCount
  }

  // Helper functions
  function calculateRiskScore(
    creditScore: bigint | undefined,
    paymentHistory: PaymentRecord[] | undefined,
    highRiskSubs: bigint[] | undefined
  ): number {
    let score = 0
    
    // Credit score impact (0-40 points)
    if (creditScore) {
      const creditScoreNum = Number(creditScore)
      console.log('Credit Score:', creditScoreNum)
      score += 40 - (creditScoreNum / 1000) * 40
    }
    
    // Payment history impact (0-30 points)
    if (paymentHistory && paymentHistory.length > 0) {
      const failedPayments = paymentHistory.filter(p => !p.success).length
      console.log('Failed Payments:', failedPayments)
      score += (failedPayments / paymentHistory.length) * 30
    } else {
      // If no payment history, add a moderate risk score
      score += 15
    }
    
    // High risk subscriptions impact (0-30 points)
    if (highRiskSubs && highRiskSubs.length > 0) {
      console.log('High Risk Subscriptions:', highRiskSubs.length)
      score += (highRiskSubs.length / 10) * 30
    }
    
    return Math.min(Math.round(score), 100)
  }

  function generateRiskReasons(
    creditScore: bigint | undefined,
    paymentHistory: PaymentRecord[] | undefined,
    highRiskSubs: bigint[] | undefined
  ): string[] {
    const reasons: string[] = []
    
    if (creditScore && Number(creditScore) < 500) {
      reasons.push("Low credit score")
    }
    
    if (paymentHistory && paymentHistory.length > 0) {
      const failedPayments = paymentHistory.filter(p => !p.success).length
      if (failedPayments > 0) {
        reasons.push(`${failedPayments} failed payments in history`)
      }
    } else {
      reasons.push("No payment history available")
    }
    
    if (highRiskSubs && highRiskSubs.length > 0) {
      reasons.push(`${highRiskSubs.length} high-risk subscriptions`)
    }
    
    return reasons.length > 0 ? reasons : ["No significant risk factors identified"]
  }

  function generateRecommendations(riskScore: number): string[] {
    const recommendations: string[] = []
    
    if (riskScore > 70) {
      recommendations.push("Consider blocking this address")
      recommendations.push("Review recent transactions carefully")
    }
    
    if (riskScore > 50) {
      recommendations.push("Monitor transactions closely")
      recommendations.push("Consider additional verification steps")
    }
    
    return recommendations.length > 0 ? recommendations : ["No specific recommendations at this time"]
  }

  async function getDetailedAnalysis(
    paymentHistory: PaymentRecord[] | undefined,
    cancellations: number,
    disputes: number
  ) {
    if (!paymentHistory || paymentHistory.length === 0) return undefined

    const averageAmount = calculateAverageAmount(paymentHistory)
    const varianceAmount = calculateVariance(paymentHistory)
    const maxAmount = findMaxAmount(paymentHistory)

    // Convert to cUSD (divide by 1e18 for wei to cUSD conversion)
    const formatAmount = (amount: bigint) => {
      const cusdAmount = Number(amount) / 1e18
      return cusdAmount.toFixed(2)
    }

    return {
      transactionHistory: {
        frequency: paymentHistory.length,
        amountPatterns: {
          average: Number(formatAmount(averageAmount)),
          variance: Number(formatAmount(varianceAmount)),
          max: Number(formatAmount(maxAmount))
        },
        timePatterns: {
          regular: checkRegularity(paymentHistory),
          intervals: calculateIntervals(paymentHistory).map(i => Number(i))
        }
      },
      subscriptionPatterns: {
        cancellations,
        disputes,
        failedPayments: paymentHistory.filter(p => !p.success).length
      }
    }
  }

  function calculateAverageAmount(payments: PaymentRecord[] | undefined): bigint {
    if (!payments || payments.length === 0) return BigInt(0)
    const amounts = payments.map(p => p.amount)
    return amounts.reduce((a, b) => a + b, BigInt(0))
  }

  function calculateVariance(payments: PaymentRecord[] | undefined): bigint {
    if (!payments || payments.length === 0) return BigInt(0)
    const amounts = payments.map(p => p.amount)
    const avg = calculateAverageAmount(payments)
    const variance = amounts.reduce((a, b) => a + (b - avg) ** 2n, BigInt(0))
    return variance / BigInt(payments.length)
  }

  function findMaxAmount(payments: PaymentRecord[] | undefined): bigint {
    if (!payments || payments.length === 0) return BigInt(0)
    return payments.map(p => p.amount).reduce((a, b) => a > b ? a : b, BigInt(0))
  }

  function checkRegularity(payments: PaymentRecord[] | undefined): boolean {
    if (!payments || payments.length < 2) return true
    const intervals = calculateIntervals(payments)
    const avg = intervals.reduce((a, b) => a + Number(b), 0) / intervals.length
    const variance = intervals.reduce((a, b) => a + (Number(b) - avg) ** 2, 0) / intervals.length
    return variance < 1000
  }

  function calculateIntervals(payments: PaymentRecord[] | undefined): bigint[] {
    if (!payments || payments.length < 2) return []
    const timestamps = payments.map(p => p.timestamp)
    return timestamps.slice(1).map((t, i) => t - timestamps[i])
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
            {/* Credit Score Section */}
            <div className="p-4 border rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Credit Score</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">Score:</p>
                  <Badge variant={fraudRisk.score > 70 ? "destructive" : "default"}>
                    {fraudRisk.score}%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm">Status:</p>
                  <Badge variant={fraudRisk.score > 70 ? "destructive" : "default"}>
                    {fraudRisk.score > 70 ? "High Risk" : fraudRisk.score > 30 ? "Medium Risk" : "Low Risk"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Risk Score Section */}
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
            
            {/* Risk Factors Section */}
            <div className="space-y-2">
              <h4 className="font-medium">Risk Factors</h4>
              <ul className="list-disc pl-4 space-y-1">
                {(fraudRisk.reasons || []).map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {reason}
                  </li>
                ))}
                {(!fraudRisk.reasons || fraudRisk.reasons.length === 0) && (
                  <li className="text-sm text-muted-foreground">No risk factors identified</li>
                )}
              </ul>
            </div>

            {/* Recommendations Section */}
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations</h4>
              <ul className="list-disc pl-4 space-y-1">
                {(fraudRisk.recommendations || []).map((recommendation, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {recommendation}
                  </li>
                ))}
                {(!fraudRisk.recommendations || fraudRisk.recommendations.length === 0) && (
                  <li className="text-sm text-muted-foreground">No recommendations available</li>
                )}
              </ul>
            </div>

            {/* Detailed Analysis Section */}
            {showDetails && (
              <div className="mt-4 space-y-4">
                <h4 className="font-medium">Detailed Analysis</h4>
                {fraudRisk.detailedAnalysis ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Transaction History</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>Frequency: {fraudRisk.detailedAnalysis.transactionHistory.frequency}</p>
                          <p>Average Amount: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.average} cUSD</p>
                          <p>Max Amount: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.max} cUSD</p>
                        </div>
                        <div>
                          <p>Regular Pattern: {fraudRisk.detailedAnalysis.transactionHistory.timePatterns.regular ? "Yes" : "No"}</p>
                          {/* <p>Variance: {fraudRisk.detailedAnalysis.transactionHistory.amountPatterns.variance} cUSD</p> */}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Subscription Patterns</h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <p>Cancellations: {fraudRisk.detailedAnalysis.subscriptionPatterns.cancellations}</p>
                        <p>Disputes: {fraudRisk.detailedAnalysis.subscriptionPatterns.disputes}</p>
                        <p>Failed Payments: {fraudRisk.detailedAnalysis.subscriptionPatterns.failedPayments}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No detailed analysis available</p>
                )}
              </div>
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