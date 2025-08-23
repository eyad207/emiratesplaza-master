import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import BrowsingHistoryList from '../browsing-history-list'

export default function EmptyCart() {
  const t = useTranslations()

  return (
    <div className='container py-10'>
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='mb-4 rounded-full bg-muted p-3'>
          <ShoppingCart className='h-8 w-8 text-muted-foreground' />
        </div>
        <h2 className='text-2xl font-bold'>
          {t('Cart.Your Shopping Cart is empty')}
        </h2>
        <p className='mt-2 text-muted-foreground max-w-md'>
          Your cart is waiting to be filled with amazing products. Browse our
          products and start shopping!
        </p>
        <Button size='lg' className='mt-6'>
          <Link href='/'>Continue Shopping</Link>
        </Button>
      </div>

      <div className='mt-20'>
        <BrowsingHistoryList />
      </div>
    </div>
  )
}
