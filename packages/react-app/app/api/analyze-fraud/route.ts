import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Return a response that tells the client to handle the analysis
    return NextResponse.json({
      message: 'Analysis should be performed on the client side',
      data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 