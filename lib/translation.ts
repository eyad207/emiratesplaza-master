import { cache } from 'react'

export interface TranslationRequest {
  text: string
  targetLanguage: 'ar' | 'en-US' | 'nb-NO'
  sourceLanguage?: string
  cacheKey?: string
}

export interface TranslationResponse {
  translatedText: string
  detectedSourceLanguage?: string
  confidence?: number
}

class TranslationService {
  private readonly maxTextLength = 5000 // Limit text length for security
  private readonly rateLimitCache = new Map<string, number>()
  private readonly translationCache = new Map<
    string,
    { data: TranslationResponse; timestamp: number }
  >()
  private readonly cacheExpirationMs = 24 * 60 * 60 * 1000 // 24 hours

  private validateInput(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input')
    }

    if (text.length > this.maxTextLength) {
      throw new Error(
        `Text too long. Maximum ${this.maxTextLength} characters allowed`
      )
    }

    // Basic security check - prevent potential injection attempts
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onclick/i,
      /onerror/i,
      /eval\(/i,
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        throw new Error('Invalid text content detected')
      }
    }
  }

  private isRateLimited(clientId: string): boolean {
    const now = Date.now()
    const lastRequest = this.rateLimitCache.get(clientId) || 0
    const timeDiff = now - lastRequest

    // Allow one request per 2 seconds per client
    if (timeDiff < 2000) {
      return true
    }

    this.rateLimitCache.set(clientId, now)
    return false
  }

  private generateCacheKey(text: string, targetLanguage: string): string {
    // Simple hash function for cache key
    let hash = 0
    const str = `${text}-${targetLanguage}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private getCachedTranslation(cacheKey: string): TranslationResponse | null {
    const cached = this.translationCache.get(cacheKey)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.cacheExpirationMs
    if (isExpired) {
      this.translationCache.delete(cacheKey)
      return null
    }

    return cached.data
  }

  private setCachedTranslation(
    cacheKey: string,
    data: TranslationResponse
  ): void {
    this.translationCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })
  }

  private async translateWithOpenAI(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const languageMap = {
      ar: 'Arabic',
      'en-US': 'English (US)',
      'nb-NO': 'Norwegian (Bokmål)',
    }

    const targetLangName =
      languageMap[targetLanguage as keyof typeof languageMap]
    if (!targetLangName) {
      throw new Error('Unsupported target language')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLangName}. 
                     Maintain the original meaning, tone, and style. 
                     If the text is already in the target language, return it unchanged.
                     Only return the translated text, nothing else.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.choices?.[0]?.message?.content?.trim()

    if (!translatedText) {
      throw new Error('No translation received')
    }

    return {
      translatedText,
      confidence: 0.9, // OpenAI typically provides high quality translations
    }
  }
  private async translateWithLibreTranslate(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
    const apiUrl =
      process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate'
    const apiKey = process.env.LIBRETRANSLATE_API_KEY

    const langMap = {
      ar: 'ar',
      'en-US': 'en',
      'nb-NO': 'no',
    }

    const targetLang = langMap[targetLanguage as keyof typeof langMap]
    if (!targetLang) {
      throw new Error('Unsupported target language')
    }

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('q', text)
      formData.append('source', 'auto')
      formData.append('target', targetLang)
      formData.append('format', 'text')

      // Add API key if available
      if (apiKey) {
        formData.append('api_key', apiKey)
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: { error?: string } = {}

        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Keep original error text
        }

        // Handle specific error cases
        if (response.status === 400 && errorData.error?.includes('API key')) {
          throw new Error(
            'LibreTranslate API key required. Get one from https://portal.libretranslate.com'
          )
        }

        throw new Error(
          `LibreTranslate API error: ${response.status} - ${errorData.error || errorText}`
        )
      }

      const data = await response.json()

      // Handle different response formats
      const translatedText = data.translatedText || data.translation || text

      return {
        translatedText,
        detectedSourceLanguage:
          data.detectedLanguage?.language || data.detected_language,
        confidence: data.detectedLanguage?.confidence || data.confidence || 0.8,
      }
    } catch {
      throw new Error('Translation failed')
    }
  }

  private async translateWithMockService(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
    // Simple mock service that returns text with language indicator
    // This is just a fallback when no real translation service is available
    const languageNames = {
      ar: 'العربية',
      'en-US': 'English',
      'nb-NO': 'Norsk',
    }

    const langName = languageNames[targetLanguage as keyof typeof languageNames]

    // For demo purposes, just add a language prefix
    // In a real scenario, you might want to return the original text
    const mockTranslation = `[${langName}] ${text}`

    return {
      translatedText: mockTranslation,
      detectedSourceLanguage: 'en',
      confidence: 0.1, // Low confidence to indicate it's a mock
    }
  }

  async translate(
    request: TranslationRequest,
    clientId: string = 'default'
  ): Promise<TranslationResponse> {
    try {
      // Validate input
      this.validateInput(request.text)

      // Check rate limiting
      if (this.isRateLimited(clientId)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Generate cache key
      const cacheKey =
        request.cacheKey ||
        this.generateCacheKey(request.text, request.targetLanguage)

      // Check cache first
      const cached = this.getCachedTranslation(cacheKey)
      if (cached) {
        return cached
      } // Attempt translation with preferred provider
      let result: TranslationResponse

      try {
        // Try OpenAI first if API key is available
        if (process.env.OPENAI_API_KEY) {
          result = await this.translateWithOpenAI(
            request.text,
            request.targetLanguage
          )
        } else if (
          process.env.LIBRETRANSLATE_API_KEY ||
          process.env.LIBRETRANSLATE_URL
        ) {
          // Try LibreTranslate if configured
          result = await this.translateWithLibreTranslate(
            request.text,
            request.targetLanguage
          )
        } else {
          // Use mock service if no real services are configured
          result = await this.translateWithMockService(
            request.text,
            request.targetLanguage
          )
        }
      } catch {
        // If primary provider fails, try fallback

        try {
          if (process.env.OPENAI_API_KEY) {
            // Try LibreTranslate as fallback for OpenAI
            result = await this.translateWithLibreTranslate(
              request.text,
              request.targetLanguage
            )
          } else {
            // Use mock service as ultimate fallback
            result = await this.translateWithMockService(
              request.text,
              request.targetLanguage
            )
          }
        } catch {
          // Return original text as final fallback
          result = {
            translatedText: request.text,
            confidence: 0,
          }
        }
      }

      // Cache the result
      this.setCachedTranslation(cacheKey, result)

      return result
    } catch {
      throw new Error('Translation failed')
    }
  }
}

// Use React cache for server-side caching
export const translationService = new TranslationService()

// Cached function for server components
export const translateText = cache(
  async (
    text: string,
    targetLanguage: 'ar' | 'en-US' | 'nb-NO',
    clientId?: string
  ): Promise<string> => {
    try {
      const result = await translationService.translate(
        {
          text,
          targetLanguage,
        },
        clientId
      )
      return result.translatedText
    } catch {
      // Return original text if translation fails
      return text
    }
  }
)
