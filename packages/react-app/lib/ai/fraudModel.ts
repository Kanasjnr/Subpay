import * as tf from '@tensorflow/tfjs'

// Define the model architecture
export async function createFraudDetectionModel() {
  const model = tf.sequential()

  // Input layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [5] // 5 features: frequency, avg_amount, variance, max_amount, regularity
  }))

  // Hidden layers
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dropout({ rate: 0.2 }))
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }))

  // Output layer
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))

  // Compile the model
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  })

  return model
}

// Preprocess transaction data for the model
export function preprocessData(transactions: any[]) {
  const features = [
    transactions.length, // frequency
    calculateAverageAmount(transactions), // avg_amount
    calculateVariance(transactions), // variance
    findMaxAmount(transactions), // max_amount
    checkRegularity(transactions) ? 1 : 0 // regularity
  ]

  return tf.tensor2d([features])
}

// Helper functions
function calculateAverageAmount(transactions: any[]): number {
  const amounts = transactions.map(t => parseFloat(ethers.formatEther(t.value)))
  return amounts.reduce((a, b) => a + b, 0) / amounts.length
}

function calculateVariance(transactions: any[]): number {
  const amounts = transactions.map(t => parseFloat(ethers.formatEther(t.value)))
  const avg = calculateAverageAmount(transactions)
  return amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length
}

function findMaxAmount(transactions: any[]): number {
  return Math.max(...transactions.map(t => parseFloat(ethers.formatEther(t.value))))
}

function checkRegularity(transactions: any[]): boolean {
  const timestamps = transactions.map(t => t.timestamp)
  const intervals = calculateIntervals(transactions)
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length
  return variance < 1000
}

function calculateIntervals(transactions: any[]): number[] {
  const timestamps = transactions.map(t => t.timestamp)
  return timestamps.slice(1).map((t, i) => t - timestamps[i])
} 