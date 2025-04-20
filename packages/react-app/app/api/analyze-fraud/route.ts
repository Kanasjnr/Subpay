import { NextResponse } from 'next/server'
import { analyzeWalletBehavior } from '@/lib/ai/fraudDetection'

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Analyze wallet behavior using the fraud detection system
    const analysis = await analyzeWalletBehavior(address)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing fraud:', error)
    return NextResponse.json(
      { error: 'Failed to analyze fraud risk' },
      { status: 500 }
    )
  }
} 