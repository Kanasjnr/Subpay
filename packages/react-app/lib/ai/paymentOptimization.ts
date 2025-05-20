import * as tf from '@tensorflow/tfjs'
import { ethers } from 'ethers'

interface PaymentPattern {
  amount: number
  timestamp: number
  success: boolean
  gasUsed: number
}

interface OptimizationResult {
  optimalAmount: number
  optimalTime: number
  confidence: number
  savings: number
  recommendations: string[]
}

// Create payment optimization model
export async function createOptimizationModel() {
  const model = tf.sequential()
  
  // Input layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [4] // [amount, timestamp, success, gasUsed]
  }))
  
  // Hidden layers
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
  
  // Output layer (predicts optimal amount and time)
  model.add(tf.layers.dense({ units: 2, activation: 'linear' }))
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  })
  
  return model
}

// Generate training data for optimization
function generateOptimizationData(numSamples: number) {
  const data: number[][] = []
  const labels: number[][] = []

  for (let i = 0; i < numSamples; i++) {
    // Generate random payment patterns
    const amount = Math.random() * 1000
    const timestamp = Math.floor(Math.random() * 86400) // Random time in day
    const success = Math.random() > 0.1 ? 1 : 0 // 90% success rate
    const gasUsed = Math.random() * 100000

    // Create feature vector
    const features = [amount, timestamp, success, gasUsed]
    data.push(features)

    // Generate optimal values (simplified)
    const optimalAmount = amount * (1 + Math.random() * 0.1) // Slightly higher
    const optimalTime = (timestamp + Math.random() * 3600) % 86400 // Within hour

    labels.push([optimalAmount, optimalTime])
  }

  return {
    features: tf.tensor2d(data),
    labels: tf.tensor2d(labels)
  }
}

// Train optimization model
export async function trainOptimizationModel() {
  try {
    const model = await createOptimizationModel()
    const { features, labels } = generateOptimizationData(1000)

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

    await model.save('indexeddb://payment-optimization-model')
    return model
  } catch (error) {
    console.error('Error training optimization model:', error)
    throw error
  }
}

// Load trained optimization model
export async function loadOptimizationModel() {
  try {
    return await tf.loadLayersModel('indexeddb://payment-optimization-model')
  } catch (error) {
    console.error('Error loading optimization model:', error)
    throw error
  }
}

// Optimize payment
export async function optimizePayment(
  address: string,
  provider: ethers.JsonRpcProvider,
  targetAmount: number
): Promise<OptimizationResult> {
  try {
    // Get transaction history
    const blockNumber = await provider.getBlockNumber()
    const startBlock = Math.max(0, blockNumber - 1000)
    
    const blocks = await Promise.all(
      Array.from({ length: blockNumber - startBlock + 1 }, (_, i) => 
        provider.getBlock(startBlock + i)
      )
    )

    // Collect payment patterns
    const patterns: PaymentPattern[] = []
    let totalGasUsed = 0
    let successfulPayments = 0

    for (const block of blocks) {
      if (!block) continue
      
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash)
        if (!tx || tx.from !== address) continue
        
        const receipt = await provider.getTransactionReceipt(txHash)
        if (!receipt) continue

        const amount = parseFloat(ethers.formatEther(tx.value))
        patterns.push({
          amount,
          timestamp: block.timestamp,
          success: receipt.status === 1,
          gasUsed: Number(receipt.gasUsed)
        })

        totalGasUsed += Number(receipt.gasUsed)
        if (receipt.status === 1) successfulPayments++
      }
    }

    // Calculate average success rate and gas usage
    const successRate = successfulPayments / patterns.length
    const avgGasUsed = totalGasUsed / patterns.length

    // Prepare features for model
    const features = tf.tensor2d([[
      targetAmount,
      Math.floor(Date.now() / 1000) % 86400, // Current time in day
      successRate,
      avgGasUsed
    ]])

    // Load model and make prediction
    const model = await loadOptimizationModel()
    const predictionTensor = model.predict(features)
    const prediction = Array.isArray(predictionTensor) 
      ? await predictionTensor[0].data()
      : await predictionTensor.data()
    
    // Ensure we have valid numbers and handle potential undefined values
    const [rawOptimalAmount, rawOptimalTime] = Array.from(prediction)
    const optimalAmount = Number(rawOptimalAmount) || 0
    const optimalTime = Number(rawOptimalTime) || 0

    // Calculate potential savings
    const savings = calculateSavings(patterns, optimalAmount, optimalTime)

    // Generate recommendations
    const recommendations = generateOptimizationRecommendations(
      optimalAmount,
      optimalTime,
      savings
    )

    return {
      optimalAmount,
      optimalTime,
      confidence: calculateConfidence(patterns, optimalAmount, optimalTime),
      savings,
      recommendations
    }
  } catch (error) {
    console.error('Error optimizing payment:', error)
    throw error
  }
}

// Helper functions
function calculateSavings(
  patterns: PaymentPattern[],
  optimalAmount: number,
  optimalTime: number
): number {
  if (patterns.length === 0) return 0

  // Calculate average gas cost for similar transactions
  const similarPatterns = patterns.filter(p => 
    Math.abs(p.amount - optimalAmount) < optimalAmount * 0.1
  )

  if (similarPatterns.length === 0) return 0

  const avgGasCost = similarPatterns.reduce((sum, p) => sum + p.gasUsed, 0) / similarPatterns.length
  return avgGasCost * 0.1 // Estimate 10% gas savings
}

function calculateConfidence(
  patterns: PaymentPattern[],
  optimalAmount: number,
  optimalTime: number
): number {
  if (patterns.length === 0) return 0.5

  // Calculate confidence based on historical success rate
  const similarPatterns = patterns.filter(p => 
    Math.abs(p.amount - optimalAmount) < optimalAmount * 0.1 &&
    Math.abs(p.timestamp - optimalTime) < 3600
  )

  if (similarPatterns.length === 0) return 0.5

  const successRate = similarPatterns.filter(p => p.success).length / similarPatterns.length
  return successRate
}

function generateOptimizationRecommendations(
  optimalAmount: number,
  optimalTime: number,
  savings: number
): string[] {
  const recommendations: string[] = []

  if (savings > 0) {
    recommendations.push(
      `Schedule payment for ${new Date(optimalTime * 1000).toLocaleTimeString()}`,
      `Optimal amount: ${optimalAmount.toFixed(4)} CELO`,
      `Estimated gas savings: ${savings.toFixed(4)} CELO`,
      "Consider batching with other payments"
    )
  } else {
    recommendations.push(
      "Current payment timing is optimal",
      "Consider adjusting payment amount",
      "Monitor gas prices for better timing",
      "Review payment frequency"
    )
  }

  return recommendations
} 