import * as tf from '@tensorflow/tfjs'
import { type PublicClient } from 'viem'

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
  provider: PublicClient,
  targetAmount: number
): Promise<OptimizationResult> {
  try {
    // Get recent transactions
    const blockNumber = await provider.getBlockNumber()
    const logs = await provider.getLogs({
      address: address as `0x${string}`,
      fromBlock: blockNumber - 10000n, // Last ~10000 blocks
      toBlock: blockNumber
    })

    // Process transaction data
    const paymentPatterns: PaymentPattern[] = []
    for (const log of logs) {
      if (!log) continue
      
      // Parse transaction data from log
      const txData = log.data
      if (typeof txData === 'string') {
        const amount = parseInt(txData.slice(2, 66), 16) / 1e18 // Convert from wei to ether
        const gasUsed = parseInt(txData.slice(66, 130), 16)
        
        // Check transaction status from topics
        const status = log.topics[1] // Assuming status is encoded in the second topic
        const success = status === '0x0000000000000000000000000000000000000000000000000000000000000001'
        
        paymentPatterns.push({
          amount,
          timestamp: Number(log.blockNumber),
          success,
          gasUsed
        })
      }
    }

    // Calculate average success rate and gas usage
    const successRate = paymentPatterns.filter(p => p.success).length / paymentPatterns.length
    const avgGasUsed = paymentPatterns.reduce((sum, p) => sum + p.gasUsed, 0) / paymentPatterns.length

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
    const savings = calculateSavings(paymentPatterns, optimalAmount, optimalTime)

    // Generate recommendations
    const recommendations = generateOptimizationRecommendations(
      optimalAmount,
      optimalTime,
      savings
    )

    return {
      optimalAmount,
      optimalTime,
      confidence: calculateConfidence(paymentPatterns, optimalAmount, optimalTime),
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