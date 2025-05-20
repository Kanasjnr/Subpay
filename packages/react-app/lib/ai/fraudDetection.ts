import { analyzeTransaction } from './trainModel'

export async function analyzeWalletBehavior(address: string) {
  try {
    // Get transaction data for the address
    const transactionData = await getTransactionData(address)
    
    // Analyze the transaction data
    const analysis = await analyzeTransaction(transactionData)
    if (!analysis) {
      throw new Error('Failed to analyze transaction')
    }
    
    // Generate risk score based on analysis
    const riskScore = calculateRiskScore(analysis)
    
    // Generate reasons and recommendations
    const reasons = generateRiskReasons(analysis, riskScore)
    const recommendations = generateRecommendations(analysis, riskScore)
    
    return {
      address,
      score: riskScore,
      reasons,
      recommendations,
      aiPrediction: {
        isFraudulent: analysis.isFraud,
        confidence: analysis.probability,
        features: [
          transactionData.frequency,
          transactionData.avgAmount,
          transactionData.variance,
          transactionData.maxAmount,
          transactionData.regularity
        ]
      },
      detailedAnalysis: {
        transactionHistory: {
          frequency: transactionData.frequency,
          amountPatterns: {
            average: transactionData.avgAmount,
            variance: transactionData.variance,
            max: transactionData.maxAmount
          },
          timePatterns: {
            regular: transactionData.regularity > 0.5,
            intervals: [] // This would be populated with actual interval data
          }
        },
        subscriptionPatterns: {
          cancellations: 0, // These would be populated with actual data
          disputes: 0,
          failedPayments: 0
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing wallet behavior:', error)
    throw error
  }
}

function calculateRiskScore(analysis: any): number {
  // Convert probability to risk score (0-100)
  return Math.round(analysis.probability * 100)
}

function generateRiskReasons(analysis: any, riskScore: number): string[] {
  const reasons: string[] = []
  
  if (analysis.isFraud) {
    reasons.push("High probability of fraudulent activity detected")
  }
  
  if (riskScore > 70) {
    reasons.push("Unusual transaction patterns detected")
  }
  
  if (riskScore > 50) {
    reasons.push("Moderate risk factors present")
  }
  
  return reasons.length > 0 ? reasons : ["No significant risk factors identified"]
}

function generateRecommendations(analysis: any, riskScore: number): string[] {
  const recommendations: string[] = []
  
  if (analysis.isFraud) {
    recommendations.push("Consider blocking this address")
    recommendations.push("Review recent transactions carefully")
  }
  
  if (riskScore > 70) {
    recommendations.push("Monitor transactions closely")
    recommendations.push("Consider additional verification steps")
  }
  
  if (riskScore > 50) {
    recommendations.push("Keep an eye on transaction patterns")
  }
  
  return recommendations.length > 0 ? recommendations : ["No specific recommendations at this time"]
}

async function getTransactionData(address: string) {
  // This should be replaced with actual transaction data fetching
  // For now, return mock data
  return {
    frequency: Math.floor(Math.random() * 200),
    avgAmount: Math.random() * 10,
    variance: Math.random() * 5,
    maxAmount: Math.random() * 20,
    regularity: Math.random()
  }
} 