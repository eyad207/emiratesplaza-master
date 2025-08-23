# Free AI Translation Configuration

This application provides completely free AI-powered translation for product descriptions and other content using multiple free translation providers with automatic fallback.

## Translation Providers (All Free)

The system uses a cascading approach with multiple free translation providers to ensure reliability:

### 1. MyMemory (Primary Provider)

- **Type**: Free Translation Memory
- **Limits**: 50,000 characters/day with email registration (5,000 without)
- **Quality**: Good for common phrases and domain-specific content
- **Website**: https://mymemory.translated.net/
- **Status**: ✅ Active and reliable

### 2. LaraTranslate (Secondary Provider)

- **Type**: Free AI Translation API
- **Limits**: 10,000 characters/month
- **Quality**: Modern AI-powered translations
- **Website**: https://laratranslate.com/
- **Status**: ✅ Active with free tier

### 3. Google Translate (Tertiary Provider)

- **Type**: Unofficial free endpoint
- **Limits**: Rate limited but generally reliable
- **Quality**: High quality but may be unstable
- **Status**: ⚠️ Backup provider (unofficial endpoint)

### 4. OpenAI (Premium Option)

- **Type**: Paid AI service (optional)
- **Limits**: Based on OpenAI pricing
- **Quality**: Highest quality translations
- **Status**: 🔄 Optional (only if API key provided)

## Setup Instructions

### Default Configuration (No API Keys Required)

The system works out of the box with no configuration needed! The free providers are prioritized automatically.

### Optional: Enhanced Translation Quality

For even better translation quality, you can optionally add an OpenAI API key:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to your `.env.local` file:

```env
# Optional: Premium translations with OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Email for MyMemory higher limits (recommended)
TRANSLATION_EMAIL=support@emiratesplaza.com
```

## Features

### Security Features

- Input validation and sanitization
- Rate limiting (1 request per 2 seconds per client)
- Maximum text length limit (5000 characters)
- XSS prevention
- Error handling with fallbacks

### Performance Features

- Server-side caching (24 hour expiration)
- React cache for server components
- Automatic fallback to original text on errors
- Support for both server and client-side translation

### Translation Features

- Supports Arabic (ar), English (en-US), and Norwegian (nb-NO)
- Automatic language detection
- Maintains original formatting and style
- SEO-friendly server-side rendering

## Usage

### Server Component (Recommended for SEO)

```tsx
import ServerTranslatedText from '@/components/shared/server-translated-text'
;<ServerTranslatedText
  text={product.description}
  fallback={product.description}
  enableTranslation={true}
/>
```

### Client Component (For dynamic content)

```tsx
import TranslatedText from '@/components/shared/translated-text'
;<TranslatedText
  text={product.description}
  fallback={product.description}
  enableTranslation={true}
/>
```

## API Endpoint

The translation API is available at `/api/translate`:

```typescript
POST /api/translate
{
  "text": "Text to translate",
  "targetLanguage": "ar" | "en-US" | "nb-NO"
}
```

## Error Handling

- If no translation service is configured, original text is returned
- If translation fails, original text is used as fallback
- Rate limiting prevents abuse
- Input validation prevents malicious content

## Performance Considerations

- Translations are cached for 24 hours
- Server-side translation is preferred for better SEO
- Rate limiting prevents excessive API usage
- Automatic fallback to alternative providers
