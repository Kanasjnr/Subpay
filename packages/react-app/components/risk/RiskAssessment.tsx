import React, { useState, useEffect } from 'react'
import { assessRisk, getRiskColor, getRiskLabel, formatRecommendations } from '@/lib/ai/riskManagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface RiskAssessmentProps {
  address: string
  targetAmount?: number
}

export function RiskAssessment({ address, targetAmount }: RiskAssessmentProps) {
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true)
        const result = await assessRisk(address, targetAmount)
        setAssessment(result)
        setError(null)
      } catch (err) {
        setError('Failed to load risk assessment')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadAssessment()
  }, [address, targetAmount])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Risk Assessment...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error || !assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Risk Assessment</span>
            <Badge
              variant="outline"
              className={`text-${getRiskColor(assessment.overallRisk.score)}-500`}
            >
              {getRiskLabel(assessment.overallRisk.score)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={assessment.overallRisk.score} className="mb-4" />
          <div className="space-y-2">
            {formatRecommendations(assessment.overallRisk.recommendations).map((rec, i) => (
              <p key={i} className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {rec}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fraud Risk */}
      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Fraud Risk Analysis</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-${getRiskColor(assessment.fraudRisk.score)}-500`}
                  >
                    {assessment.fraudRisk.isFraudulent ? 'Suspicious' : 'Normal'}
                  </Badge>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <Progress value={assessment.fraudRisk.score} className="mb-4" />
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Risk Factors</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {assessment.fraudRisk.reasons.map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {formatRecommendations(assessment.fraudRisk.recommendations).map((rec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Credit Risk */}
      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Credit Risk Assessment</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-${getRiskColor(100 - assessment.creditRisk.score)}-500`}
                  >
                    {assessment.creditRisk.riskLevel}
                  </Badge>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <Progress value={100 - assessment.creditRisk.score} className="mb-4" />
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Credit Factors</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p>{assessment.creditRisk.factors.transactionHistory.totalVolume.toFixed(2)} CELO</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Amount</p>
                    <p>{assessment.creditRisk.factors.transactionHistory.averageAmount.toFixed(2)} CELO</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Frequency</p>
                    <p>{assessment.creditRisk.factors.transactionHistory.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Age</p>
                    <p>{assessment.creditRisk.factors.accountAge.toFixed(1)} days</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {formatRecommendations(assessment.creditRisk.recommendations).map((rec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment Optimization */}
      {targetAmount && (
        <Collapsible>
          <CollapsibleTrigger className="w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Optimization</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {assessment.paymentOptimization.savings > 0 ? 'Optimized' : 'No Optimization'}
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Optimization Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Optimal Amount</p>
                      <p>{assessment.paymentOptimization.optimalAmount.toFixed(4)} CELO</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Optimal Time</p>
                      <p>{new Date(assessment.paymentOptimization.optimalTime * 1000).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Savings</p>
                      <p>{assessment.paymentOptimization.savings.toFixed(4)} CELO</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p>{(assessment.paymentOptimization.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {formatRecommendations(assessment.paymentOptimization.recommendations).map((rec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
} 