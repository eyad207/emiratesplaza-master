'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'

interface TranslatedTextProps {
  text: string
  fallback?: string
  className?: string
  enableTranslation?: boolean
}

export default function TranslatedText({
  text,
  fallback = '',
  className = '',
  enableTranslation = true,
}: TranslatedTextProps) {
  const [translatedText, setTranslatedText] = useState<string>(text)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locale = useLocale() as 'ar' | 'en-US' | 'nb-NO'

  useEffect(() => {
    if (!enableTranslation || !text || text.trim() === '') {
      setTranslatedText(text)
      return
    }

    const translateContent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.trim(),
            targetLanguage: locale,
          }),
        })

        if (!response.ok) {
          throw new Error(`Translation failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.translatedText) {
          setTranslatedText(data.translatedText)
        } else {
          throw new Error(data.error || 'Translation failed')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Translation failed')
        // Keep original text on error
        setTranslatedText(text)
      } finally {
        setIsLoading(false)
      }
    } // Always attempt translation when locale changes and text is substantial
    // Skip translation for very short text (like single words) or if translation is disabled
    const shouldTranslate = text.length > 3

    if (shouldTranslate) {
      translateContent()
    } else {
      setTranslatedText(text)
    }
  }, [text, locale, enableTranslation])

  if (isLoading) {
    return <Skeleton className={`h-4 w-full ${className}`} />
  }

  if (error && fallback) {
    return <span className={className}>{fallback}</span>
  }

  return <span className={className}>{translatedText}</span>
}
