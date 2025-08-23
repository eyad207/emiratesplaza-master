// Environment variable validation for security
const requiredEnvVars = [
  'MONGODB_URI',
  'AUTH_SECRET',
  'RESEND_API_KEY',
  'SENDER_EMAIL',
  'SENDER_NAME',
] as const

const paymentEnvVars = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_APP_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

export function validateEnvironmentVariables() {
  const missing: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  // Validate MongoDB URI format
  if (
    process.env.MONGODB_URI &&
    !process.env.MONGODB_URI.startsWith('mongodb')
  ) {
    throw new Error('Invalid MONGODB_URI format')
  }

  // Validate AUTH_SECRET length
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long')
  }
}

export function validateTranslationConfiguration() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasLibreTranslate = !!process.env.LIBRETRANSLATE_URL

  if (!hasOpenAI && !hasLibreTranslate) {
    return false
  }

  if (hasOpenAI) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey?.startsWith('sk-')) {
      return false
    }
  }

  return true
}

// Sanitize sensitive data from logs
export function sanitizeForLog(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sensitive = ['password', 'token', 'secret', 'key', 'auth']
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}

export function validatePaymentEnvironmentVariables() {
  const missing: string[] = []

  for (const envVar of paymentEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing payment environment variables: ${missing.join(', ')}`
    )
    return false
  }

  return true
}
