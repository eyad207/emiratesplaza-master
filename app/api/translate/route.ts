import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-new'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    // Get user session for rate limiting
    const session = await auth()
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'anonymous'
    const clientId = session?.user?.id || clientIp

    // Parse request body
    const body = await request.json()
    const { text, targetLanguage } = body

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid text parameter' },
        { status: 400 }
      )
    }

    if (!targetLanguage || !['ar', 'en-US', 'nb-NO'].includes(targetLanguage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target language' },
        { status: 400 }
      )
    }

    // Check text length
    if (text.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Text too long' },
        { status: 400 }
      )
    }

    // Perform translation
    const result = await translationService.translate(
      {
        text,
        targetLanguage,
      },
      clientId
    )

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      confidence: result.confidence,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        )
      }

      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Translation service temporarily unavailable' },
      { status: 503 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
