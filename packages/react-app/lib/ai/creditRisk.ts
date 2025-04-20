import * as tf from '@tensorflow/tfjs'
import { ethers } from 'ethers'

interface CreditRiskFactors {
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

interface CreditRiskAssessment {
  creditScore: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
  factors: CreditRiskFactors
  recommendations: string[]
}

// Create credit risk assessment model
export async function createCreditRiskModel() {
  const model = tf.sequential()
  
  // Input layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: [5] // [totalVolume, averageAmount, frequency, consistency, accountAge]
  }))
  
  // Hidden layers
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }))
  
  // Output layer
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  })
  
  return model
}

// Generate training data for credit risk
function generateCreditTrainingData(numSamples: number) {
  const data: number[][] = []
  const labels: number[] = []

  for (let i = 0; i < numSamples; i++) {
    // Generate random credit factors
    const totalVolume = Math.random() * 10000
    const averageAmount = Math.random() * 1000
    const frequency = Math.floor(Math.random() * 100)
    const consistency = Math.random()
    const accountAge = Math.floor(Math.random() * 365)

    // Create feature vector
    const features = [totalVolume, averageAmount, frequency, consistency, accountAge]
    data.push(features)

    // Generate label (1 = good credit, 0 = bad credit)
    const creditScore = 
      (totalVolume > 5000 ? 0.2 : 0) +
      (averageAmount > 500 ? 0.2 : 0) +
      (frequency > 50 ? 0.2 : 0) +
      (consistency > 0.7 ? 0.2 : 0) +
      (accountAge > 180 ? 0.2 : 0)

    labels.push(creditScore > 0.7 ? 1 : 0)
  }

  return {
    features: tf.tensor2d(data),
    labels: tf.tensor1d(labels)
  }
}

// Train credit risk model
export async function trainCreditRiskModel() {
  try {
    const model = await createCreditRiskModel()
    const { features, labels } = generateCreditTrainingData(1000)

    await model.fit(features, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`)
        }
      }
    })

    await model.save('indexeddb://credit-risk-model')
    return model
  } catch (error) {
    console.error('Error training credit risk model:', error)
    throw error
  }
}

// Load trained credit risk model
export async function loadCreditRiskModel() {
  try {
    return await tf.loadLayersModel('indexeddb://credit-risk-model')
  } catch (error) {
    console.error('Error loading credit risk model:', error)
    throw error
  }
}

// Analyze credit risk
export async function analyzeCreditRisk(
  address: string,
  provider: ethers.JsonRpcProvider
): Promise<CreditRiskAssessment> {
  try {
    // Get transaction history
    const blockNumber = await provider.getBlockNumber()
    const startBlock = Math.max(0, blockNumber - 1000)
    
    const blocks = await Promise.all(
      Array.from({ length: blockNumber - startBlock + 1 }, (_, i) => 
        provider.getBlock(startBlock + i)
      )
    )

    // Calculate credit factors
    const transactions = []
    let totalVolume = 0
    let onTimePayments = 0
    let latePayments = 0
    let failedPayments = 0

    for (const block of blocks) {
      if (!block) continue
      
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash)
        if (!tx || (tx.from !== address && tx.to !== address)) continue
        
        const amount = parseFloat(ethers.formatEther(tx.value))
        totalVolume += amount
        transactions.push({
          amount,
          timestamp: block.timestamp
        })
      }
    }

    // Calculate credit factors
    const averageAmount = totalVolume / transactions.length
    const frequency = transactions.length
    const consistency = calculateConsistency(transactions)
    const accountAge = calculateAccountAge(transactions)

    // Prepare features for model
    const features = tf.tensor2d([[
      totalVolume,
      averageAmount,
      frequency,
      consistency,
      accountAge
    ]])

    // Load model and make prediction
    const model = await loadCreditRiskModel()
    const prediction = await model.predict(features).data()
    const creditScore = prediction[0] * 100

    // Determine risk level
    const riskLevel = creditScore > 80 ? 'low' : creditScore > 50 ? 'medium' : 'high'

    // Generate recommendations
    const recommendations = generateCreditRecommendations(creditScore, riskLevel)

    return {
      creditScore,
      riskLevel,
      confidence: prediction[0],
      factors: {
        transactionHistory: {
          totalVolume,
          averageAmount,
          frequency,
          consistency
        },
        paymentHistory: {
          onTimePayments,
          latePayments,
          failedPayments
        },
        accountAge,
        balance: 0 // This would come from your contract
      },
      recommendations
    }
  } catch (error) {
    console.error('Error analyzing credit risk:', error)
    throw error
  }
}

// Helper functions
function calculateConsistency(transactions: any[]): number {
  if (transactions.length < 2) return 1
  const intervals = transactions.slice(1).map((t, i) => t.timestamp - transactions[i].timestamp)
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length
  return Math.max(0, 1 - variance / 1000)
}

function calculateAccountAge(transactions: any[]): number {
  if (transactions.length === 0) return 0
  const oldest = Math.min(...transactions.map(t => t.timestamp))
  const newest = Math.max(...transactions.map(t => t.timestamp))
  return (newest - oldest) / (24 * 60 * 60) // Convert to days
}

function generateCreditRecommendations(creditScore: number, riskLevel: string): string[] {
  const recommendations: string[] = []

  if (riskLevel === 'high') {
    recommendations.push(
      "Require additional collateral",
      "Implement stricter payment terms",
      "Monitor account activity closely",
      "Consider reducing credit limit"
    )
  } else if (riskLevel === 'medium') {
    recommendations.push(
      "Regular credit reviews recommended",
      "Maintain current credit terms",
      "Monitor payment patterns",
      "Consider gradual credit limit increases"
    )
  } else {
    recommendations.push(
      "Eligible for credit limit increase",
      "Consider offering premium terms",
      "Regular monitoring sufficient",
      "Potential for automated approvals"
    )
  }

  return recommendations
} 