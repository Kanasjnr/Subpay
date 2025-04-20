import * as tf from '@tensorflow/tfjs'
import { createFraudDetectionModel } from './fraudModel'

// Generate synthetic training data
function generateTrainingData(numSamples: number) {
  const data: number[][] = []
  const labels: number[] = []

  for (let i = 0; i < numSamples; i++) {
    // Generate random transaction features
    const frequency = Math.floor(Math.random() * 200) // 0-200 transactions
    const avgAmount = Math.random() * 10 // 0-10 CELO
    const variance = Math.random() * 5 // 0-5 variance
    const maxAmount = Math.random() * 20 // 0-20 CELO
    const regularity = Math.random() // 0-1 (0 = irregular, 1 = regular)

    // Create feature vector
    const features = [frequency, avgAmount, variance, maxAmount, regularity]
    data.push(features)

    // Generate label (1 = fraud, 0 = legitimate)
    // Higher frequency, variance, and max amount increase fraud probability
    const fraudProbability = 
      (frequency > 100 ? 0.3 : 0) +
      (variance > 2 ? 0.2 : 0) +
      (maxAmount > 10 ? 0.2 : 0) +
      (regularity < 0.3 ? 0.3 : 0)

    labels.push(fraudProbability > 0.5 ? 1 : 0)
  }

  return {
    features: tf.tensor2d(data),
    labels: tf.tensor1d(labels)
  }
}

export async function trainModel() {
  try {
    // Create and compile model
    const model = await createFraudDetectionModel()

    // Generate training data
    const { features, labels } = generateTrainingData(1000)

    // Train the model
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

    // Save the model
    await model.save('indexeddb://fraud-detection-model')

    console.log('Model trained and saved successfully!')
    return model
  } catch (error) {
    console.error('Error training model:', error)
    throw error
  }
}

// Function to load the trained model
export async function loadTrainedModel() {
  try {
    const model = await tf.loadLayersModel('indexeddb://fraud-detection-model')
    return model
  } catch (error) {
    console.error('Error loading model:', error)
    throw error
  }
} 