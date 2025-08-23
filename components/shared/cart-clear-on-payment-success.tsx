'use client'

import { useEffect } from 'react'
import useCartStore from '@/hooks/use-cart-store'

export default function CartClearOnPaymentSuccess() {
  const { clearCart } = useCartStore()

  useEffect(() => {
    // Clear the cart when the component mounts (payment success)
    clearCart()
  }, [clearCart])

  // This component doesn't render anything visible
  return null
}
