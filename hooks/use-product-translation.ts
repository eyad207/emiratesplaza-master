'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

interface TranslationCache {
  [key: string]: {
    [locale: string]: string
  }
}

// In-memory cache for translations
const translationCache: TranslationCache = {}

/**
 * Hook to translate product names and descriptions
 */
export function useProductTranslation(
  originalText: string,
  type: 'name' | 'description' = 'name'
) {
  const locale = useLocale() as 'ar' | 'en-US' | 'nb-NO'
  const [translatedText, setTranslatedText] = useState<string>(originalText)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    // If the locale is English or the text is empty, return original
    if (locale === 'en-US' || !originalText?.trim()) {
      setTranslatedText(originalText)
      return
    }

    // Check cache first
    const cacheKey = `${originalText}_${type}`
    if (translationCache[cacheKey]?.[locale]) {
      setTranslatedText(translationCache[cacheKey][locale])
      return
    } // Translate the text
    const translateText = async () => {
      setIsLoading(true)
      try {
        // Add a small delay to spread out API calls
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 300))

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: originalText,
            targetLanguage: locale,
            type,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const translated = data.translatedText || originalText

          // Cache the result
          if (!translationCache[cacheKey]) {
            translationCache[cacheKey] = {}
          }
          translationCache[cacheKey][locale] = translated

          setTranslatedText(translated)
        } else {
          setTranslatedText(originalText)
        }
      } catch {
        setTranslatedText(originalText)
      } finally {
        setIsLoading(false)
      }
    }

    translateText()
  }, [originalText, locale, type])

  return {
    translatedText,
    isLoading,
    isOriginal: locale === 'en-US' || translatedText === originalText,
  }
}

/**
 * Hook specifically for product names with optimized settings
 */
export function useProductNameTranslation(productName: string) {
  return useProductTranslation(productName, 'name')
}

/**
 * Hook specifically for product descriptions with optimized settings
 */
export function useProductDescriptionTranslation(productDescription: string) {
  return useProductTranslation(productDescription, 'description')
}
