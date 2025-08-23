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
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isRateLimited(_clientId: string): boolean {
    // Disable rate limiting for development/testing
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
  private detectLanguageForTranslation(text: string): string {
    const normalizedText = text.toLowerCase().trim()

    // Arabic detection - look for Arabic script
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ar'
    }

    // Norwegian detection - look for specific Norwegian characters
    if (/[æøåÆØÅ]/.test(text)) {
      return 'no'
    }

    // Enhanced Norwegian words detection
    const norwegianWords = [
      // Common words
      'og',
      'eller',
      'for',
      'med',
      'på',
      'av',
      'til',
      'fra',
      'som',
      'jeg',
      'du',
      'han',
      'hun',
      'det',
      'vi',
      'de',
      'ikke',
      'være',
      'ha',
      'kunne',
      'skulle',
      'ville',
      'få',
      // Product-related Norwegian words
      'sko',
      'skjorte',
      'bukse',
      'jakke',
      'kjole',
      'genser',
      'trøye',
      'shorts',
      'jeans',
      'undertøy',
      // Shopping/ecommerce related Norwegian words
      'pris',
      'kvalitet',
      'størrelse',
      'farge',
      'merke',
      'produkter',
      'kjøp',
      'salg',
      'tilbud',
      // Color names in Norwegian
      'rød',
      'blå',
      'grønn',
      'gul',
      'svart',
      'hvit',
      'grå',
      'brun',
      'rosa',
      'lilla',
      // Category names in Norwegian
      'klær',
      'elektronikk',
      'hjem',
      'hage',
      'sport',
      'barn',
      'dame',
      'herre',
    ]

    const words = normalizedText.split(/\s+/)

    // Check if any word is specifically Norwegian
    for (const word of words) {
      if (norwegianWords.includes(word)) {
        return 'no'
      }
    }

    // Default to English
    return 'en'
  }

  private async translateWithMyMemory(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
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
      // Use our improved language detection
      const detectedSourceLang = this.detectLanguageForTranslation(text)

      // Skip if source and target are the same
      if (detectedSourceLang === targetLang) {
        return {
          translatedText: text, // Return original text
          detectedSourceLanguage: detectedSourceLang,
          confidence: 1.0,
        }
      }

      const email = process.env.TRANSLATION_EMAIL || 'support@emiratesplaza.com'
      const url = new URL('https://api.mymemory.translated.net/get')
      url.searchParams.set('q', text)
      url.searchParams.set('langpair', `${detectedSourceLang}|${targetLang}`)
      url.searchParams.set('de', email) // Email for higher limit

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'EmiratesPlaza/1.0 (support@emiratesplaza.com)',
        },
      })

      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.responseStatus !== 200) {
        throw new Error(`MyMemory API error: ${data.responseDetails}`)
      }
      return {
        translatedText: data.responseData.translatedText,
        detectedSourceLanguage: detectedSourceLang,
        confidence: data.responseData.match || 0.7,
      }
    } catch {
      throw new Error('Translation failed')
    }
  }

  private async translateWithFreeGoogleTranslate(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
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
      // Using a free Google Translate API endpoint
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data[0] || !data[0][0] || !data[0][0][0]) {
        throw new Error('Invalid response from Google Translate')
      }

      const translatedText = data[0][0][0]
      const detectedLanguage = data[2] || 'auto'

      return {
        translatedText,
        detectedSourceLanguage: detectedLanguage,
        confidence: 0.8,
      }
    } catch {
      throw new Error('Translation failed')
    }
  }

  private async translateWithLaraTranslate(
    text: string,
    targetLanguage: string
  ): Promise<TranslationResponse> {
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
      // LaraTranslate offers 10,000 chars/month free
      const response = await fetch('https://api.laratranslate.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EmiratesPlaza/1.0',
        },
        body: JSON.stringify({
          text: text,
          source: 'auto',
          target: targetLang,
        }),
      })

      if (!response.ok) {
        throw new Error(`LaraTranslate API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.translation) {
        throw new Error('Invalid response from LaraTranslate')
      }

      return {
        translatedText: data.translation,
        detectedSourceLanguage: data.detectedLanguage || 'auto',
        confidence: 0.8,
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
        // Try free services first (no API key required)
        try {
          result = await this.translateWithMyMemory(
            request.text,
            request.targetLanguage
          )
        } catch {
          result = await this.translateWithFreeGoogleTranslate(
            request.text,
            request.targetLanguage
          )
        }
      } catch {
        // If all free providers fail, try OpenAI if available

        if (process.env.OPENAI_API_KEY) {
          try {
            result = await this.translateWithOpenAI(
              request.text,
              request.targetLanguage
            )
          } catch {
            // Use mock service as ultimate fallback
            result = await this.translateWithMockService(
              request.text,
              request.targetLanguage
            )
          }
        } else {
          // Use mock service as ultimate fallback
          result = await this.translateWithMockService(
            request.text,
            request.targetLanguage
          )
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
