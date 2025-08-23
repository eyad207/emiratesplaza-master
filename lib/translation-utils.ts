import { translationService } from '@/lib/translation-new'

/**
 * Batch translate multiple texts efficiently
 */
export async function batchTranslate(
  texts: string[],
  targetLanguage: 'ar' | 'en-US' | 'nb-NO',
  clientId: string = 'batch'
): Promise<{ [key: string]: string }> {
  const results: { [key: string]: string } = {}

  // Process translations with a small delay to respect rate limits
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i]
    if (!text || text.trim() === '') {
      results[text] = text
      continue
    }

    try {
      const result = await translationService.translate(
        {
          text,
          targetLanguage,
        },
        `${clientId}-${i}`
      )

      results[text] = result.translatedText
    } catch {
      results[text] = text // Fallback to original
    }

    // Small delay to respect rate limits
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Preload translations for common product fields
 */
export async function preloadProductTranslations(
  products: Array<{ description: string; name?: string }>,
  targetLanguage: 'ar' | 'en-US' | 'nb-NO'
): Promise<void> {
  const textsToTranslate = products
    .flatMap((p) =>
      [p.description, p.name].filter((text): text is string => Boolean(text))
    )
    .filter((text, index, array) => array.indexOf(text) === index) // Remove duplicates

  if (textsToTranslate.length === 0) return

  try {
    await batchTranslate(textsToTranslate, targetLanguage, 'preload')
  } catch {}
}

/**
 * Clear translation cache (useful for admin operations)
 */
export function clearTranslationCache(): void {
  // This would require access to the translation service internals
  // For now, we'll just log the action
}
