import { useState, useCallback } from 'react'
import { analyzeTransaction } from './trainModel'

export function useFraudDetection() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<{
    isFraud: boolean
    probability: number
    riskLevel: string
  } | null>(null)

  const analyze = useCallback(async (transactionData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const analysis = await analyzeTransaction(transactionData)
      setResult(analysis)
      return analysis
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    analyze,
    isLoading,
    error,
    result
  }
} 