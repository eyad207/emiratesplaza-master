'use client'

import { useEffect } from 'react'
import useCartStore from '@/hooks/use-cart-store'

interface CartClearOnOrderViewProps {
  orderId: string
  isPaid: boolean
  fromPayment?: boolean
  paymentParams?: string[]
}

export default function CartClearOnOrderView({
  orderId,
  isPaid,
  fromPayment = false,
  paymentParams = [],
}: CartClearOnOrderViewProps) {
  const { clearCart } = useCartStore()

  useEffect(() => {
    // Clear cart if:
    // 1. Order is paid and we're coming from a payment flow, OR
    // 2. Order is paid and URL suggests payment success (has payment-related params)
    const hasPaymentParams =
      paymentParams.includes('payment_intent') ||
      paymentParams.includes('paymentId') ||
      paymentParams.includes('PayerID') ||
      paymentParams.includes('payment') ||
      fromPayment

    if (isPaid && hasPaymentParams) {
      clearCart()
    }
  }, [orderId, isPaid, fromPayment, clearCart, paymentParams])

  // This component doesn't render anything visible
  return null
}
