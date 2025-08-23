import { NextResponse } from 'next/server'
import { warmupDatabase } from '@/lib/db/connection-pool'

// API route to warmup database connection
export async function GET() {
  try {
    const isReady = await warmupDatabase(3000)
    
    return NextResponse.json({ 
      success: true, 
      ready: isReady,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error('Warmup failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Warmup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Add CORS headers for external warmup services
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
