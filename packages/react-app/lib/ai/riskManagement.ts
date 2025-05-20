import { ethers } from 'ethers'
import { analyzeWalletBehavior } from './fraudDetection'
import { analyzeCreditRisk } from './creditRisk'
import { optimizePayment } from './paymentOptimization'

interface RiskAssessment {
  fraudRisk: {
    score: number
    isFraudulent: boolean
    confidence: number
    reasons: string[]
    recommendations: string[]
  }
  creditRisk: {
    score: number
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    factors: {
      transactionHistory: {
        totalVolume: number
        averageAmount: number
        frequency: number
        consistency: number
      }
      paymentHistory: {
        onTimePayments: number
        latePayments: number
        failedPayments: number
      }
      accountAge: number
      balance: number
    }
    recommendations: string[]
  }
  paymentOptimization: {
    optimalAmount: number
    optimalTime: number
    confidence: number
    savings: number
    recommendations: string[]
  }
  overallRisk: {
    score: number
    level: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
}

// Celo testnet provider
const provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')

export async function assessRisk(
  address: string,
  targetAmount?: number
): Promise<RiskAssessment> {
  try {
    // Run all risk assessments in parallel
    const [fraudAnalysis, creditAnalysis, paymentOptimization] = await Promise.all([
      analyzeWalletBehavior(address),
      analyzeCreditRisk(address, provider),
      targetAmount ? optimizePayment(address, provider, targetAmount) : null
    ])

    // Calculate overall risk score
    const overallScore = calculateOverallRisk(
      fraudAnalysis.aiPrediction.isFraudulent ? 100 : 0,
      creditAnalysis.creditScore,
      paymentOptimization?.confidence ?? 0.5
    )

    // Determine overall risk level
    const overallLevel = overallScore > 70 ? 'high' : overallScore > 30 ? 'medium' : 'low'

    // Generate overall recommendations
    const overallRecommendations = generateOverallRecommendations(
      fraudAnalysis.recommendations,
      creditAnalysis.recommendations,
      paymentOptimization?.recommendations ?? []
    )

    return {
      fraudRisk: {
        score: fraudAnalysis.aiPrediction.isFraudulent ? 100 : 0,
        isFraudulent: fraudAnalysis.aiPrediction.isFraudulent,
        confidence: fraudAnalysis.aiPrediction.confidence,
        reasons: fraudAnalysis.reasons,
        recommendations: fraudAnalysis.recommendations
      },
      creditRisk: {
        score: creditAnalysis.creditScore,
        riskLevel: creditAnalysis.riskLevel,
        confidence: creditAnalysis.confidence,
        factors: creditAnalysis.factors,
        recommendations: creditAnalysis.recommendations
      },
      paymentOptimization: paymentOptimization ? {
        optimalAmount: paymentOptimization.optimalAmount,
        optimalTime: paymentOptimization.optimalTime,
        confidence: paymentOptimization.confidence,
        savings: paymentOptimization.savings,
        recommendations: paymentOptimization.recommendations
      } : {
        optimalAmount: 0,
        optimalTime: 0,
        confidence: 0,
        savings: 0,
        recommendations: []
      },
      overallRisk: {
        score: overallScore,
        level: overallLevel,
        recommendations: overallRecommendations
      }
    }
  } catch (error) {
    console.error('Error assessing risk:', error)
    throw error
  }
}

function calculateOverallRisk(
  fraudScore: number,
  creditScore: number,
  paymentConfidence: number
): number {
  // Weight the different risk factors
  const fraudWeight = 0.4
  const creditWeight = 0.4
  const paymentWeight = 0.2

  // Calculate weighted average
  const weightedScore = 
    (fraudScore * fraudWeight) +
    ((100 - creditScore) * creditWeight) + // Invert credit score (higher = lower risk)
    ((1 - paymentConfidence) * 100 * paymentWeight) // Convert confidence to risk

  return Math.min(weightedScore, 100)
}

function generateOverallRecommendations(
  fraudRecommendations: string[],
  creditRecommendations: string[],
  paymentRecommendations: string[]
): string[] {
  const recommendations = new Set<string>()

  // Add high-priority recommendations first
  fraudRecommendations.forEach(rec => recommendations.add(rec))
  creditRecommendations.forEach(rec => recommendations.add(rec))
  paymentRecommendations.forEach(rec => recommendations.add(rec))

  // Add general recommendations based on risk level
  if (recommendations.size === 0) {
    recommendations.add("Maintain standard security measures")
    recommendations.add("Regular monitoring recommended")
    recommendations.add("Keep security protocols up to date")
  }

  return Array.from(recommendations)
}

// Export helper functions for UI components
export function getRiskColor(score: number): string {
  if (score > 70) return 'red'
  if (score > 30) return 'orange'
  return 'green'
}

export function getRiskLabel(score: number): string {
  if (score > 70) return 'High Risk'
  if (score > 30) return 'Medium Risk'
  return 'Low Risk'
}

export function formatRecommendations(recommendations: string[]): string[] {
  return recommendations.map(rec => {
    // Add emoji based on recommendation type
    if (rec.toLowerCase().includes('monitor')) return '👀 ' + rec
    if (rec.toLowerCase().includes('security')) return '🔒 ' + rec
    if (rec.toLowerCase().includes('payment')) return '💰 ' + rec
    if (rec.toLowerCase().includes('risk')) return '⚠️ ' + rec
    return '📝 ' + rec
  })
} 