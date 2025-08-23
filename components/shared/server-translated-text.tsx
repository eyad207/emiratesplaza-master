import { getLocale } from 'next-intl/server'
import { translateText } from '@/lib/translation-new'
import { validateTranslationConfiguration } from '@/lib/env-validation'

interface ServerTranslatedTextProps {
  text: string
  fallback?: string
  className?: string
  enableTranslation?: boolean
}

export default async function ServerTranslatedText({
  text,
  fallback,
  className = '',
  enableTranslation = true,
}: ServerTranslatedTextProps) {
  if (!enableTranslation || !text || text.trim() === '') {
    return <span className={className}>{text}</span>
  }

  const locale = (await getLocale()) as 'ar' | 'en-US' | 'nb-NO'

  // Check if translation service is configured
  const isTranslationConfigured = validateTranslationConfiguration()

  if (!isTranslationConfigured) {
    return <span className={className}>{text}</span>
  }

  try {
    // Only translate if we're not in the default language (en-US)
    // or if the text appears to be in a different language
    const shouldTranslate =
      locale !== 'en-US' ||
      text.includes('العربية') ||
      text.includes('norsk') ||
      text.includes('på')

    if (!shouldTranslate) {
      return <span className={className}>{text}</span>
    }

    const translatedText = await translateText(text, locale)
    return <span className={className}>{translatedText}</span>
  } catch {
    // Fallback to original text
    return <span className={className}>{fallback || text}</span>
  }
}
