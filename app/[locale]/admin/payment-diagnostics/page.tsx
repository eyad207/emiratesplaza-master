'use client'

import { useEffect, useState } from 'react'

export default function PaymentDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<{
    paypal: boolean
    stripe: boolean
    errors: string[]
  } | null>(null)

  useEffect(() => {
    const checkPaymentConfig = async () => {
      try {
        const response = await fetch('/api/payment-diagnostics')
        const data = await response.json()
        setDiagnostics(data)
      } catch (error) {
        console.error('Failed to check payment config:', error)
        setDiagnostics({
          paypal: false,
          stripe: false,
          errors: ['Failed to check payment configuration'],
        })
      }
    }

    checkPaymentConfig()
  }, [])

  if (!diagnostics) {
    return <div className='p-4'>Checking payment configuration...</div>
  }

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>
        Payment Configuration Diagnostics
      </h1>

      <div className='space-y-4'>
        <div
          className={`p-4 rounded-lg ${diagnostics.paypal ? 'bg-green-100' : 'bg-red-100'}`}
        >
          <h2 className='font-semibold'>PayPal Configuration</h2>
          <p className={diagnostics.paypal ? 'text-green-700' : 'text-red-700'}>
            {diagnostics.paypal ? '✅ Configured' : '❌ Missing configuration'}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg ${diagnostics.stripe ? 'bg-green-100' : 'bg-red-100'}`}
        >
          <h2 className='font-semibold'>Stripe Configuration</h2>
          <p className={diagnostics.stripe ? 'text-green-700' : 'text-red-700'}>
            {diagnostics.stripe ? '✅ Configured' : '❌ Missing configuration'}
          </p>
        </div>

        {diagnostics.errors.length > 0 && (
          <div className='p-4 rounded-lg bg-yellow-100'>
            <h2 className='font-semibold text-yellow-700'>
              Configuration Issues
            </h2>
            <ul className='mt-2 space-y-1'>
              {diagnostics.errors.map((error, index) => (
                <li key={index} className='text-yellow-700'>
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className='mt-6 p-4 bg-gray-100 rounded-lg'>
        <h2 className='font-semibold mb-2'>Required Environment Variables</h2>
        <p className='text-sm text-gray-600 mb-2'>
          Make sure these are set in your .env.local file:
        </p>
        <ul className='text-sm space-y-1'>
          <li>
            <code>PAYPAL_CLIENT_ID</code>
          </li>
          <li>
            <code>PAYPAL_APP_SECRET</code>
          </li>
          <li>
            <code>STRIPE_SECRET_KEY</code>
          </li>
          <li>
            <code>STRIPE_WEBHOOK_SECRET</code>
          </li>
          <li>
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
