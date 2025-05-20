import * as tf from '@tensorflow/tfjs'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Initialize TensorFlow.js only in browser
if (isBrowser) {
  tf.setBackend('cpu')
}

// Generate synthetic training data
function generateTrainingData(numSamples: number) {
  if (!isBrowser) return { features: null, labels: null }

  const data: number[][] = []
  const labels: number[] = []

  for (let i = 0; i < numSamples; i++) {
    const frequency = Math.floor(Math.random() * 200)
    const avgAmount = Math.random() * 10
    const variance = Math.random() * 5
    const maxAmount = Math.random() * 20
    const regularity = Math.random()

    const features = [frequency, avgAmount, variance, maxAmount, regularity]
    data.push(features)

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

// Create and compile the model
function createModel() {
  if (!isBrowser) return null

  const model = tf.sequential()

  // Input layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [5]
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

// Train the model
export async function trainModel() {
  if (!isBrowser) return null

  try {
    const model = createModel()
    if (!model) throw new Error('Model creation failed')

    const { features, labels } = generateTrainingData(1000)
    if (!features || !labels) throw new Error('Data generation failed')

    await model.fit(features, labels, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2
    })

    return model
  } catch (error) {
    console.error('Error training model:', error)
    throw error
  }
}

// Load or create model
export async function loadTrainedModel() {
  if (!isBrowser) return null

  try {
    return await trainModel()
  } catch (error) {
    console.error('Error loading model:', error)
    throw error
  }
}

// Analyze transaction
export async function analyzeTransaction(transactionData: any) {
  if (!isBrowser) return null

  try {
    const model = await loadTrainedModel()
    if (!model) throw new Error('Model loading failed')

    const features = tf.tensor2d([[
      transactionData.frequency || 0,
      transactionData.avgAmount || 0,
      transactionData.variance || 0,
      transactionData.maxAmount || 0,
      transactionData.regularity || 0
    ]])
    
    const prediction = model.predict(features) as tf.Tensor
    const fraudProbability = prediction.dataSync()[0]
    
    return {
      isFraud: fraudProbability > 0.5,
      probability: fraudProbability,
      riskLevel: fraudProbability > 0.8 ? 'HIGH' : fraudProbability > 0.5 ? 'MEDIUM' : 'LOW'
    }
  } catch (error) {
    console.error('Error analyzing transaction:', error)
    throw error
  }
} 