import { Metadata } from 'next'
import CheckoutForm from './checkout-form'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Checkout',
}

async function CheckoutContent() {
  const session = await auth()
  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/checkout')
  }
  return <CheckoutForm />
}

export default function CheckoutPage() {
  return (
    <div>
      <Suspense
        fallback={
          <div className='flex justify-center items-center py-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-muted-foreground'>Loading checkout...</p>
            </div>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </div>
  )
}
