import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function addSecurityHeaders(
  request: NextRequest,
  response: NextResponse
) {
  // Security headers to prevent cache poisoning and other attacks
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  // Cache-Control headers to prevent cache poisoning
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('Surrogate-Control', 'no-store')
  response.headers.set('Vary', 'Origin, Accept-Encoding')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://utfs.io https://api.resend.com",
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
    "require-trusted-types-for 'script'",
    "trusted-types 'default' 'dompurify'",
    'sandbox allow-forms allow-scripts allow-same-origin allow-popups',
    "navigate-to 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}
