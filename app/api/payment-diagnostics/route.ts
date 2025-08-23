import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const diagnostics = {
      paypal: false,
      stripe: false,
      errors: [] as string[],
    }

    // Check PayPal configuration
    const paypalClientId = process.env.PAYPAL_CLIENT_ID
    const paypalAppSecret = process.env.PAYPAL_APP_SECRET

    if (!paypalClientId) {
      diagnostics.errors.push('PAYPAL_CLIENT_ID is not set')
    }
    if (!paypalAppSecret) {
      diagnostics.errors.push('PAYPAL_APP_SECRET is not set')
    }

    diagnostics.paypal = !!(paypalClientId && paypalAppSecret)

    // Check Stripe configuration
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!stripeSecretKey) {
      diagnostics.errors.push('STRIPE_SECRET_KEY is not set')
    }
    if (!stripeWebhookSecret) {
      diagnostics.errors.push('STRIPE_WEBHOOK_SECRET is not set')
    }
    if (!stripePublishableKey) {
      diagnostics.errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    }

    diagnostics.stripe = !!(
      stripeSecretKey &&
      stripeWebhookSecret &&
      stripePublishableKey
    )

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('Payment diagnostics error:', error)
    return NextResponse.json(
      {
        paypal: false,
        stripe: false,
        errors: ['Internal server error while checking payment configuration'],
      },
      { status: 500 }
    )
  }
}
