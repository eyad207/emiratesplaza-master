'use server'

import { translationService } from './translation-new'

export interface MultilingualSearchOptions {
  query: string
  category: string
  targetLanguage: 'ar' | 'en-US' | 'nb-NO'
  sourceLanguage?: string
}

export interface ProcessedSearchTerms {
  originalQuery: string
  translatedQueries: string[]
  originalCategory: string
  translatedCategories: string[]
  detectedLanguage?: string
}

export interface MongoFilter {
  $or?: Array<Record<string, unknown>>
  $and?: Array<Record<string, unknown>>
  category?: Record<string, unknown>
  [key: string]: unknown
}

class MultilingualSearch {
  /**
   * Detects the language of the input text based on character patterns
   */
  public detectLanguage(text: string): string {
    if (!text) return 'en-US'

    const normalizedText = text.toLowerCase().trim()

    // Arabic detection - look for Arabic script
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ar'
    }

    // Norwegian detection - look for specific Norwegian characters
    if (/[æøåÆØÅ]/.test(text)) {
      return 'nb-NO'
    }

    // Enhanced Norwegian words/phrases detection
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
      // Norwegian specific words that are different from English
      'størrelse',
      'levering',
      'bestilling',
      'betaling',
      'retur',
      'garanti',
      // Common Norwegian adjectives for products
      'god',
      'beste',
      'billig',
      'dyr',
      'ny',
      'brukt',
      'stor',
      'liten',
      'lett',
      'tung',
    ]

    const words = normalizedText.split(/\s+/)

    // Check if any word is specifically Norwegian
    for (const word of words) {
      if (norwegianWords.includes(word)) {
        return 'nb-NO'
      }
    }

    // Check for Norwegian word patterns or endings
    for (const word of words) {
      // Norwegian word endings that are distinctive
      if (
        word.length > 3 &&
        (word.endsWith('else') || // Norwegian: størrelse, hastighelse
          word.endsWith('het') || // Norwegian: kvalitet, sikkerhet
          word.endsWith('ing') || // Norwegian: levering, bestilling (though English has this too)
          word.endsWith('skap') || // Norwegian: landskap, partnerskap
          word.endsWith('dom')) // Norwegian: fridom, visdom
      ) {
        return 'nb-NO'
      }
    }

    // Check for multiple Norwegian characteristics
    const norwegianMatches = words.filter((word) =>
      norwegianWords.includes(word)
    ).length
    if (norwegianMatches > 0) {
      return 'nb-NO'
    }

    // If it's a single word and contains certain letter combinations common in Norwegian
    if (words.length === 1) {
      const word = words[0]
      // Norwegian letter combinations
      if (
        word.includes('skj') ||
        word.includes('kj') ||
        word.includes('øy') ||
        word.includes('ey') ||
        word.includes('åk') ||
        word.includes('ål')
      ) {
        return 'nb-NO'
      }
    }

    // Default to English
    return 'en-US'
  } /**
   * Common product term mappings for multilingual search
   */
  private getCommonProductTerms(): Record<string, Record<string, string[]>> {
    return {
      ar: {
        // Product types
        حذاء: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear'],
        قميص: ['shirt', 't-shirt', 'tshirt', 'top'],
        بنطلون: ['pants', 'trousers', 'jeans', 'bottom'],
        فستان: ['dress', 'gown'],
        جاكيت: ['jacket', 'coat', 'blazer'],
        ساعة: ['watch', 'timepiece'],
        هاتف: ['phone', 'mobile', 'smartphone'],
        حقيبة: ['bag', 'handbag', 'purse', 'backpack'],
        نظارة: ['glasses', 'sunglasses', 'eyewear'],
        سوار: ['bracelet', 'wristband'],

        // Colors
        أحمر: ['red', 'rød'],
        أزرق: ['blue', 'blå'],
        أخضر: ['green', 'grønn'],
        أصفر: ['yellow', 'gul'],
        أسود: ['black', 'svart'],
        أبيض: ['white', 'hvit'],
        رمادي: ['gray', 'grey', 'grå'],
        بني: ['brown', 'brun'],
        وردي: ['pink', 'rosa'],
        بنفسجي: ['purple', 'lilla'],

        // Sizes
        صغير: ['small', 's', 'liten'],
        متوسط: ['medium', 'm', 'middels'],
        كبير: ['large', 'l', 'stor'],
        كبير_جدا: ['extra large', 'xl', 'ekstra stor'],
        كبير_جدا_جدا: ['xxl', 'extra extra large'],

        // Brands (popular ones)
        أديداس: ['adidas'],
        نايك: ['nike'],
        بوما: ['puma'],
        أسيكس: ['asics'],
        سيكو: ['seiko'],
        فوسيل: ['fossil'],
      },
      'nb-NO': {
        // Product types
        sko: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear'],
        skjorte: ['shirt', 't-shirt', 'tshirt', 'top'],
        bukse: ['pants', 'trousers', 'jeans', 'bottom'],
        kjole: ['dress', 'gown'],
        jakke: ['jacket', 'coat', 'blazer'],
        klokke: ['watch', 'timepiece'],
        telefon: ['phone', 'mobile', 'smartphone'],
        veske: ['bag', 'handbag', 'purse', 'backpack'],
        briller: ['glasses', 'sunglasses', 'eyewear'],
        armbånd: ['bracelet', 'wristband'],

        // Colors
        rød: ['red', 'أحمر'],
        blå: ['blue', 'أزرق'],
        grønn: ['green', 'أخضر'],
        gul: ['yellow', 'أصفر'],
        svart: ['black', 'أسود'],
        hvit: ['white', 'أبيض'],
        grå: ['gray', 'grey', 'رمادي'],
        brun: ['brown', 'بني'],
        rosa: ['pink', 'وردي'],
        lilla: ['purple', 'بنفسجي'],

        // Sizes
        liten: ['small', 's', 'صغير'],
        middels: ['medium', 'm', 'متوسط'],
        stor: ['large', 'l', 'كبير'],
        'ekstra stor': ['extra large', 'xl', 'كبير_جدا'],

        // Brands
        adidas: ['أديداس'],
        nike: ['نايك'],
        puma: ['بوما'],
        asics: ['أسيكس'],
        seiko: ['سيكو'],
        fossil: ['فوسيل'],
      },
      'en-US': {
        // Product types
        shoes: ['حذاء', 'sko'],
        shirt: ['قميص', 'skjorte'],
        pants: ['بنطلون', 'bukse'],
        dress: ['فستان', 'kjole'],
        jacket: ['جاكيت', 'jakke'],
        watch: ['ساعة', 'klokke'],
        phone: ['هاتف', 'telefon'],
        bag: ['حقيبة', 'veske'],
        glasses: ['نظارة', 'briller'],
        bracelet: ['سوار', 'armbånd'],

        // Colors
        red: ['أحمر', 'rød'],
        blue: ['أزرق', 'blå'],
        green: ['أخضر', 'grønn'],
        yellow: ['أصفر', 'gul'],
        black: ['أسود', 'svart'],
        white: ['أبيض', 'hvit'],
        gray: ['رمادي', 'grå'],
        grey: ['رمادي', 'grå'],
        brown: ['بني', 'brun'],
        pink: ['وردي', 'rosa'],
        purple: ['بنفسجي', 'lilla'],

        // Sizes
        small: ['صغير', 'liten'],
        s: ['صغير', 'liten'],
        medium: ['متوسط', 'middels'],
        m: ['متوسط', 'middels'],
        large: ['كبير', 'stor'],
        l: ['كبير', 'stor'],
        'extra large': ['كبير_جدا', 'ekstra stor'],
        xl: ['كبير_جدا', 'ekstra stor'],
        xxl: ['كبير_جدا_جدا'],

        // Brands
        adidas: ['أديداس'],
        nike: ['نايك'],
        puma: ['بوما'],
        asics: ['أسيكس'],
        seiko: ['سيكو'],
        fossil: ['فوسيل'],
      },
    }
  }

  /**
   * Generate fuzzy variations of a text for typo tolerance
   */
  private generateFuzzyVariations(text: string): string[] {
    if (!text || text.length < 2) return []

    const variations: string[] = []
    const lowerText = text.toLowerCase()

    // Common character substitutions for each language
    const substitutions: Record<string, Record<string, string>> = {
      ar: {
        ا: 'آأإ',
        ة: 'ه',
        ي: 'ى',
        و: 'ؤ',
      },
      'nb-NO': {
        å: 'a',
        æ: 'ae',
        ø: 'o',
        a: 'å',
        o: 'ø',
        e: 'æ',
      },
      'en-US': {
        c: 'k',
        k: 'c',
        s: 'z',
        z: 's',
      },
    }

    // Generate substitution variations
    Object.values(substitutions).forEach((langSubs) => {
      Object.entries(langSubs).forEach(([from, to]) => {
        if (lowerText.includes(from)) {
          to.split('').forEach((char) => {
            variations.push(lowerText.replace(new RegExp(from, 'g'), char))
          })
        }
      })
    })

    // Generate transposition variations (swap adjacent characters)
    for (let i = 0; i < lowerText.length - 1; i++) {
      const chars = lowerText.split('')
      const temp = chars[i]
      chars[i] = chars[i + 1]
      chars[i + 1] = temp
      variations.push(chars.join(''))
    }

    return variations.filter((v) => v !== lowerText)
  }
  /**
   * Generate search suggestions for auto-complete
   */ async generateSearchSuggestions(
    partialQuery: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    targetLanguage: 'ar' | 'en-US' | 'nb-NO' = 'en-US',

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    limit: number = 5
  ): Promise<string[]> {
    // This would connect to your database to get matching product names    // For now, return an empty array based on the query
    if (partialQuery.length < 2) return []

    // TODO: Implement actual suggestion logic
    const suggestions: string[] = []

    return suggestions
  }

  /**
   * Detect and correct spelling errors in search queries
   */
  async detectAndCorrectSpelling(
    query: string,
    targetLanguage: 'ar' | 'en-US' | 'nb-NO' = 'en-US'
  ): Promise<{
    isLikelyMisspelled: boolean
    correctedQuery?: string
    confidence: number
  }> {
    // Simple spell checking logic
    const commonMisspellings: Record<string, Record<string, string>> = {
      'nb-NO': {
        kso: 'sko',
        skjirt: 'skjorte',
        bukser: 'bukse',
      },
      ar: {
        احاذيي: 'حذاء',
        قميظ: 'قميص',
        بنطال: 'بنطلون',
      },
      'en-US': {
        shose: 'shoes',
        tshrt: 'tshirt',
        jens: 'jeans',
      },
    }

    const misspellings = commonMisspellings[targetLanguage] || {}
    const lowerQuery = query.toLowerCase().trim()

    if (misspellings[lowerQuery]) {
      return {
        isLikelyMisspelled: true,
        correctedQuery: misspellings[lowerQuery],
        confidence: 0.9,
      }
    }

    return {
      isLikelyMisspelled: false,
      confidence: 1.0,
    }
  }

  /**
   * Translates a search query to all supported languages to ensure comprehensive search coverage
   * Uses simple product term mappings for better accuracy
   */
  private async translateToAllLanguages(
    text: string,
    sourceLanguage?: string
  ): Promise<string[]> {
    if (!text || text.trim() === '' || text === 'all') {
      return [text]
    }

    const detectedLang = sourceLanguage || this.detectLanguage(text)
    const translations = new Set([text]) // Always include original
    const lowerText = text.toLowerCase().trim()

    // Generate fuzzy variations of the original text for typo tolerance
    const fuzzyVariations = this.generateFuzzyVariations(text)
    fuzzyVariations.forEach((variation) => translations.add(variation))

    // Check if this is a common product term we can directly map
    const productTerms = this.getCommonProductTerms()

    // Check if the query matches any common product terms
    if (productTerms[detectedLang as keyof typeof productTerms]) {
      const termMappings =
        productTerms[detectedLang as keyof typeof productTerms]

      for (const [term, equivalents] of Object.entries(termMappings)) {
        if (
          lowerText === term.toLowerCase() ||
          lowerText.includes(term.toLowerCase())
        ) {
          // Add direct English equivalents
          equivalents.forEach((equiv) => {
            translations.add(equiv)
            translations.add(equiv.toLowerCase())
          })
        }
      }
    }

    // For common English terms, add their foreign equivalents
    if (detectedLang === 'en-US') {
      const englishTerms = productTerms['en-US']
      for (const [englishTerm, foreignEquivalents] of Object.entries(
        englishTerms
      )) {
        if (
          lowerText === englishTerm.toLowerCase() ||
          lowerText.includes(englishTerm.toLowerCase())
        ) {
          foreignEquivalents.forEach((equiv) => translations.add(equiv))
        }
      }
    }

    // Only use translation service as fallback for terms we don't have mappings for
    const hasDirectMapping =
      Array.from(translations).length > fuzzyVariations.length + 1

    if (!hasDirectMapping) {
      try {
        const targetLanguages: ('ar' | 'en-US' | 'nb-NO')[] = [
          'ar',
          'en-US',
          'nb-NO',
        ]

        for (const targetLang of targetLanguages) {
          if (targetLang === detectedLang) continue
          try {
            const result = await translationService.translate({
              text,
              targetLanguage: targetLang,
              sourceLanguage: detectedLang,
            })

            if (result.translatedText && result.translatedText !== text) {
              // For translated text, try to extract simple terms instead of complex phrases
              const simplifiedTranslation = this.extractSimpleTerms(
                result.translatedText
              )
              translations.add(simplifiedTranslation)
              translations.add(simplifiedTranslation.toLowerCase())
            }
          } catch {
            // Silently handle translation errors
          }
        }
      } catch {
        // Silently handle translation service errors
      }
    }

    return Array.from(translations)
  }
  /**
   * Extracts simple product terms from complex translated phrases
   */
  private extractSimpleTerms(translatedText: string): string {
    // Remove common phrases and extract the core product term
    const simplified = translatedText
      .replace(/^(a pair of|en|et)\s+/i, '') // Remove "a pair of", "en", "et"
      .replace(/\s*\.\.\.\s*/g, '') // Remove "..."
      .replace(/[!?,.]/g, '') // Remove punctuation
      .trim()

    // If it's still a complex phrase, try to extract the key noun
    const words = simplified.split(/\s+/)
    if (words.length > 2) {
      // Look for common product keywords
      const productKeywords = [
        'shoes',
        'shoe',
        'shirt',
        'pants',
        'dress',
        'jacket',
        'watch',
        'phone',
        'bag',
      ]
      const foundKeyword = words.find((word) =>
        productKeywords.some((keyword) =>
          word.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      if (foundKeyword) {
        return foundKeyword
      }
      // Otherwise, take the last word which is often the noun
      return words[words.length - 1]
    }

    return simplified
  }
  /**
   * Creates multiple search patterns for MongoDB regex matching
   * Enhanced with fuzzy search capabilities
   */ private createSearchPatterns(
    terms: string[],
    restrictive: boolean = false
  ): Array<{ $regex: string; $options: string }> {
    const patterns = []

    for (const term of terms) {
      if (!term || term.trim() === '') continue

      // Escape special regex characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // Add exact match pattern
      patterns.push({
        $regex: escapedTerm,
        $options: 'i',
      })

      // Add word boundary patterns for better matching
      patterns.push({
        $regex: `\\b${escapedTerm}\\b`,
        $options: 'i',
      })

      // Add partial match for compound words
      if (escapedTerm.length > 3) {
        patterns.push({
          $regex: `${escapedTerm}`,
          $options: 'i',
        })
      }

      // Add fuzzy patterns for typo tolerance only if not restrictive
      if (!restrictive && term.length >= 4) {
        // Increased minimum length from 3 to 4
        // Create pattern that allows for single character differences
        const chars = escapedTerm.split('')

        // Pattern for missing character (e.g., "shos" should match "shoes") - only for longer terms
        if (chars.length >= 4) {
          // Increased from 3 to 4
          for (let i = 0; i < chars.length; i++) {
            const pattern = chars
              .slice(0, i)
              .concat(chars.slice(i + 1))
              .join('.')
            if (pattern.length >= 3) {
              // Increased from 2 to 3
              patterns.push({
                $regex: pattern,
                $options: 'i',
              })
            }
          }
        }

        // Pattern for extra character (e.g., "shoeees" should match "shoes")
        const deduplicatedPattern = escapedTerm.replace(/(.)\1+/g, '$1')
        if (
          deduplicatedPattern !== escapedTerm &&
          deduplicatedPattern.length >= 3
        ) {
          patterns.push({
            $regex: deduplicatedPattern,
            $options: 'i',
          })
        }
      }
    }

    return patterns
  }

  /**
   * Processes search terms and categories for multilingual search
   */
  async processSearchTerms(
    options: MultilingualSearchOptions
  ): Promise<ProcessedSearchTerms> {
    const { query, category, sourceLanguage } = options

    // Detect language if not provided
    const detectedLanguage =
      sourceLanguage || this.detectLanguage(query || category)

    // Process query
    const translatedQueries =
      query === 'all' || !query
        ? [query]
        : await this.translateToAllLanguages(query, detectedLanguage)

    // Process category
    let translatedCategories = [category]
    if (category !== 'all' && category) {
      translatedCategories = await this.translateToAllLanguages(
        category,
        detectedLanguage
      )
    }

    return {
      originalQuery: query,
      translatedQueries,
      originalCategory: category,
      translatedCategories,
      detectedLanguage,
    }
  }
  /**
   * Creates a MongoDB query filter for multilingual search
   */ createMultilingualFilter(searchTerms: ProcessedSearchTerms): MongoFilter {
    const filters: MongoFilter = {}

    // Query filter - search in name, description, and category
    if (searchTerms.originalQuery && searchTerms.originalQuery !== 'all') {
      const queryPatterns = this.createSearchPatterns(
        searchTerms.translatedQueries,
        true // Use restrictive mode for search results
      )

      // Create $or conditions for different fields
      const searchConditions = []

      // Search in product name
      for (const pattern of queryPatterns) {
        searchConditions.push({ name: pattern })
      }

      // Search in product description
      for (const pattern of queryPatterns) {
        searchConditions.push({ description: pattern })
      }

      // Search in brand
      for (const pattern of queryPatterns) {
        searchConditions.push({ brand: pattern })
      }

      if (searchConditions.length > 0) {
        filters.$or = searchConditions
      }
    }

    // Category filter
    if (
      searchTerms.originalCategory &&
      searchTerms.originalCategory !== 'all'
    ) {
      const categoryPatterns = this.createSearchPatterns(
        searchTerms.translatedCategories,
        false // Less restrictive for categories
      )

      // For category, we want exact or partial matches
      const categoryConditions = categoryPatterns.map((pattern) => ({
        category: pattern,
      }))

      if (filters.$or && categoryConditions.length > 0) {
        // If we already have query filters, add category as additional AND condition
        // We'll use $or for categories too, but wrap it properly
        filters.$and = [{ $or: filters.$or }, { $or: categoryConditions }]
        delete filters.$or
      } else if (categoryConditions.length > 0) {
        // If no query, just filter by category
        filters.$or = categoryConditions
      }
    }

    return filters
  }

  /**
   * Fetch all unique product categories from the database
   */
  private async getProductCategories(): Promise<string[]> {
    try {
      const { getAllCategories } = await import('./actions/product.actions')
      const categories = await getAllCategories()
      return categories || []
    } catch {
      return []
    }
  }

  /**
   * Translate categories to the target language
   */
  async translateCategories(
    categories: string[],
    targetLanguage: 'ar' | 'en-US' | 'nb-NO'
  ): Promise<Array<{ original: string; translated: string }>> {
    const translatedCategories: Array<{
      original: string
      translated: string
    }> = []

    for (const category of categories) {
      try {
        // Try to translate category to target language
        const translationResult = await translationService.translate({
          text: category,
          targetLanguage,
          sourceLanguage: 'en-US', // Categories are typically stored in English
        })
        if (translationResult.translatedText) {
          translatedCategories.push({
            original: category,
            translated: translationResult.translatedText,
          })
        } else {
          // Fallback to original category if translation fails
          translatedCategories.push({
            original: category,
            translated: category,
          })
        }
      } catch {
        // Fallback to original category
        translatedCategories.push({
          original: category,
          translated: category,
        })
      }
    }
    return translatedCategories
  }

  /**
   * Translate tags to the target language
   */
  async translateTags(
    tags: Array<{ _id: string; name: string }>,
    targetLanguage: 'ar' | 'en-US' | 'nb-NO'
  ): Promise<Array<{ _id: string; original: string; translated: string }>> {
    const translatedTags: Array<{
      _id: string
      original: string
      translated: string
    }> = []

    for (const tag of tags) {
      try {
        // Try to translate tag name to target language
        const translationResult = await translationService.translate({
          text: tag.name,
          targetLanguage,
          sourceLanguage: 'en-US', // Tags are typically stored in English
        })
        if (translationResult.translatedText) {
          translatedTags.push({
            _id: tag._id,
            original: tag.name,
            translated: translationResult.translatedText,
          })
        } else {
          // Fallback to original tag name if translation fails
          translatedTags.push({
            _id: tag._id,
            original: tag.name,
            translated: tag.name,
          })
        }
      } catch {
        // Fallback to original tag name
        translatedTags.push({
          _id: tag._id,
          original: tag.name,
          translated: tag.name,
        })
      }
    }

    return translatedTags
  }
}

/**
 * Export function to translate categories for display
 */
export async function translateCategoriesForDisplay(
  categories: string[],
  targetLanguage: 'ar' | 'en-US' | 'nb-NO'
): Promise<Array<{ original: string; translated: string }>> {
  const search = new MultilingualSearch()
  return search.translateCategories(categories, targetLanguage)
}

/**
 * Export function to translate tags for display
 */
export async function translateTagsForDisplay(
  tags: Array<{ _id: string; name: string }>,
  targetLanguage: 'ar' | 'en-US' | 'nb-NO'
): Promise<Array<{ _id: string; original: string; translated: string }>> {
  const search = new MultilingualSearch()
  return search.translateTags(tags, targetLanguage)
}

/**
 * Generate search suggestions for auto-complete
 */
export async function generateSearchSuggestions(
  partialQuery: string,
  targetLanguage: 'ar' | 'en-US' | 'nb-NO' = 'en-US',
  limit: number = 5
): Promise<string[]> {
  const search = new MultilingualSearch()
  return search.generateSearchSuggestions(partialQuery, targetLanguage, limit)
}

/**
 * Detect and correct spelling errors in search queries
 */
export async function detectAndCorrectSpelling(
  query: string,
  targetLanguage: 'ar' | 'en-US' | 'nb-NO' = 'en-US'
): Promise<{
  isLikelyMisspelled: boolean
  correctedQuery?: string
  confidence: number
}> {
  const search = new MultilingualSearch()
  return search.detectAndCorrectSpelling(query, targetLanguage)
}

/**
 * Process multilingual search terms
 */
export async function processMultilingualSearch(
  options: MultilingualSearchOptions
): Promise<ProcessedSearchTerms> {
  const search = new MultilingualSearch()
  return search.processSearchTerms(options)
}

/**
 * Detect the language of a query
 */
export async function detectQueryLanguage(text: string): Promise<string> {
  const search = new MultilingualSearch()
  return search.detectLanguage(text)
}

/**
 * Create multilingual search filter for MongoDB
 */
export async function createMultilingualSearchFilter(
  processedTerms: ProcessedSearchTerms
): Promise<MongoFilter> {
  const filter: MongoFilter = { $or: [] }

  // Add search queries - Enhanced to search across multiple fields
  if (processedTerms.originalQuery && processedTerms.originalQuery !== 'all') {
    const searchQueries = [
      processedTerms.originalQuery,
      ...processedTerms.translatedQueries,
    ]

    // Remove duplicates
    const uniqueQueries = [...new Set(searchQueries)]

    uniqueQueries.forEach((query) => {
      if (query && query.trim() !== '') {
        filter.$or?.push(
          // Search in product name
          { name: { $regex: query, $options: 'i' } },
          // Search in description
          { description: { $regex: query, $options: 'i' } },
          // Search in brand
          { brand: { $regex: query, $options: 'i' } },
          // Search in category (already handled below but included for completeness)
          { category: { $regex: query, $options: 'i' } },
          // Search in colors
          { 'colors.color': { $regex: query, $options: 'i' } },
          // Search in sizes
          { 'colors.sizes.size': { $regex: query, $options: 'i' } }
        )
      }
    })
  }

  if (
    processedTerms.originalCategory &&
    processedTerms.originalCategory !== 'all'
  ) {
    filter.category = {
      $in: [
        processedTerms.originalCategory,
        ...processedTerms.translatedCategories,
      ],
    }
  }

  return filter
}
