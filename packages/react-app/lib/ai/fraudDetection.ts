import { ethers } from 'ethers'
import { createFraudDetectionModel, preprocessData } from './fraudModel'
import { loadTrainedModel } from './trainModel'
import { SubPay } from '@/lib/contracts/SubPay'

// Celo testnet provider
const provider = new ethers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')

interface TransactionAnalysis {
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

interface WalletBehavior {
  transactionHistory: TransactionAnalysis
  subscriptionPatterns: {
    cancellations: number
    disputes: number
    failedPayments: number
  }
  riskScore: number
  aiPrediction: {
    isFraudulent: boolean
    confidence: number
    features: number[]
  }
  reasons: string[]
  recommendations: string[]
}

interface TransactionData {
  value: bigint
  blockNumber: number
  timestamp: number
}

let model: any = null

export async function analyzeWalletBehavior(address: string): Promise<WalletBehavior> {
  try {
    // Initialize model if not already loaded
    if (!model) {
      try {
        // Try to load trained model
        model = await loadTrainedModel()
      } catch (error) {
        console.log('No trained model found, creating new model...')
        model = await createFraudDetectionModel()
      }
    }

    // Get transaction history from Celo testnet
    const blockNumber = await provider.getBlockNumber()
    const startBlock = Math.max(0, blockNumber - 1000) // Look at last 1000 blocks
    
    // Get all blocks in range
    const blocks = await Promise.all(
      Array.from({ length: blockNumber - startBlock + 1 }, (_, i) => 
        provider.getBlock(startBlock + i)
      )
    )

    // Get transactions for the address
    const transactions: TransactionData[] = []
    for (const block of blocks) {
      if (!block) continue
      
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash)
        if (!tx) continue
        
        if (tx.from === address || tx.to === address) {
          transactions.push({
            value: tx.value,
            blockNumber: block.number,
            timestamp: block.timestamp
          })
        }
      }
    }

    // Get subscription data from contract
    const subPay = new SubPay(provider)
    const subscriptionData = await subPay.getSubscriptionData(address)
    
    // Analyze transaction patterns
    const transactionAnalysis: TransactionAnalysis = {
      frequency: transactions.length,
      amountPatterns: {
        average: calculateAverageAmount(transactions),
        variance: calculateVariance(transactions),
        max: findMaxAmount(transactions),
      },
      timePatterns: {
        regular: checkRegularity(transactions),
        intervals: calculateIntervals(transactions),
      },
    }

    // Get AI prediction
    const features = preprocessData(transactions)
    const prediction = await model.predict(features).data()
    const confidence = prediction[0]
    const isFraudulent = confidence > 0.7 // Threshold for fraud detection

    // Calculate risk score based on patterns and AI prediction
    const riskScore = calculateRiskScore(transactionAnalysis, confidence)

    // Generate reasons and recommendations based on AI prediction
    const reasons = generateRiskReasons(transactionAnalysis, isFraudulent)
    const recommendations = generateRecommendations(riskScore, isFraudulent)

    return {
      transactionHistory: transactionAnalysis,
      subscriptionPatterns: {
        cancellations: subscriptionData.cancellations,
        disputes: subscriptionData.disputes,
        failedPayments: subscriptionData.failedPayments,
      },
      riskScore,
      aiPrediction: {
        isFraudulent,
        confidence,
        features: Array.from(features.dataSync())
      },
      reasons,
      recommendations
    }
  } catch (error) {
    console.error('Error analyzing wallet behavior:', error)
    throw error
  }
}

// Helper functions for analysis
function calculateAverageAmount(transactions: TransactionData[]): number {
  const amounts = transactions.map(t => parseFloat(ethers.formatEther(t.value)))
  return amounts.reduce((a, b) => a + b, 0) / amounts.length
}

function calculateVariance(transactions: TransactionData[]): number {
  const amounts = transactions.map(t => parseFloat(ethers.formatEther(t.value)))
  const avg = calculateAverageAmount(transactions)
  return amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length
}

function findMaxAmount(transactions: TransactionData[]): number {
  return Math.max(...transactions.map(t => parseFloat(ethers.formatEther(t.value))))
}

function checkRegularity(transactions: TransactionData[]): boolean {
  const timestamps = transactions.map(t => t.timestamp)
  const intervals = calculateIntervals(transactions)
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length
  return variance < 1000 // Threshold for regularity
}

function calculateIntervals(transactions: TransactionData[]): number[] {
  const timestamps = transactions.map(t => t.timestamp).sort((a, b) => a - b)
  const intervals: number[] = []
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1])
  }
  return intervals
}

function calculateRiskScore(analysis: TransactionAnalysis, aiConfidence: number): number {
  let score = 0

  // Frequency scoring
  if (analysis.frequency > 100) score += 20
  else if (analysis.frequency > 50) score += 10

  // Amount pattern scoring
  if (analysis.amountPatterns.variance > 100) score += 30
  if (analysis.amountPatterns.max > 1000) score += 20

  // Time pattern scoring
  if (!analysis.timePatterns.regular) score += 30

  // AI confidence scoring
  score += Math.floor(aiConfidence * 50) // Add up to 50 points based on AI confidence

  return Math.min(score, 100)
}

function generateRiskReasons(analysis: TransactionAnalysis, isFraudulent: boolean): string[] {
  const reasons: string[] = []

  if (isFraudulent) {
    reasons.push("AI model detected suspicious patterns")
  }

  if (analysis.frequency > 100) {
    reasons.push("High transaction frequency")
  }

  if (analysis.amountPatterns.variance > 2) {
    reasons.push("Unusual transaction amount patterns")
  }

  if (!analysis.timePatterns.regular) {
    reasons.push("Irregular transaction timing")
  }

  return reasons
}

function generateRecommendations(riskScore: number, isFraudulent: boolean): string[] {
  const recommendations: string[] = []

  if (isFraudulent) {
    recommendations.push(
      "Consider additional verification steps",
      "Monitor transaction patterns closely",
      "Review recent transaction history"
    )
  }

  if (riskScore > 70) {
    recommendations.push(
      "Implement enhanced security measures",
      "Consider temporary account restrictions",
      "Review and update security protocols"
    )
  } else if (riskScore > 30) {
    recommendations.push(
      "Monitor account activity",
      "Implement basic verification steps",
      "Review transaction patterns"
    )
  } else {
    recommendations.push(
      "Maintain standard security measures",
      "Regular monitoring recommended",
      "Keep security protocols up to date"
    )
  }

  return recommendations
} 