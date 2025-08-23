import { NextRequest, NextResponse } from 'next/server'
import {
  generateSearchSuggestions,
  detectAndCorrectSpelling,
  detectQueryLanguage,
} from '@/lib/multilingual-search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    let locale =
      (searchParams.get('locale') as 'ar' | 'en-US' | 'nb-NO') || 'en-US'
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [], spellCheck: null })
    }

    // Auto-detect language if not provided or if query doesn't match the provided locale
    const detectedLanguage = await detectQueryLanguage(query)

    // Use detected language if it's different from provided locale
    if (detectedLanguage !== locale) {
      locale = detectedLanguage as 'ar' | 'en-US' | 'nb-NO'
    }

    // Generate suggestions and spell check in parallel
    const [suggestions, spellCheck] = await Promise.all([
      generateSearchSuggestions(query, locale, limit),
      detectAndCorrectSpelling(query, locale),
    ])

    return NextResponse.json({
      suggestions,
      spellCheck: spellCheck.isLikelyMisspelled ? spellCheck : null,
      detectedLanguage: locale, // Include detected language in response
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
