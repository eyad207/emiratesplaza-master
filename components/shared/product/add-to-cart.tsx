/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { OrderItem } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddToCart({
  item,
  minimal = false,
  selectedSize,
}: {
  item: OrderItem & { discountedPrice?: number }
  minimal?: boolean
  selectedSize?: string
}) {
  const router = useRouter()
  const { toast } = useToast()

  const { addItem } = useCartStore()

  const [quantity, setQuantity] = useState(1)

  const t = useTranslations()

  const getCountInStockForSelectedSize = () => {
    const colorObj = item.colors.find((c) => c.color === item.color)
    const sizeObj = colorObj?.sizes.find((s) => s.size === selectedSize)
    return sizeObj ? sizeObj.countInStock : 0
  }

  const handleAddToCart = async (e?: React.MouseEvent) => {
    // Prevent link navigation when button is clicked
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    try {
      // Always use discountedPrice if present
      const itemToAdd = {
        ...item,
        price: item.discountedPrice ?? item.price,
      }
      const result = await addItem(itemToAdd, quantity)

      if (!result.success) {
        // Translate the error message
        let errorMessage = result.message || 'Failed to add item to cart'
        if (errorMessage === 'You cant add it to cart, change color or size') {
          errorMessage = t(
            'Product.You cant add it to cart, change color or size'
          )
        }

        toast({
          variant: 'destructive',
          description: errorMessage,
        })
        return
      }

      toast({
        description: t('Product.Added to Cart'),
        action: (
          <Button
            className='dark:border dark:border-border/70 dark:hover:border-primary/70'
            onClick={() => {
              router.push('/cart')
            }}
          >
            {t('Product.Go to Cart')}
          </Button>
        ),
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'An unexpected error occurred',
      })
    }
  }
  const handleBuyNow = async (e?: React.MouseEvent) => {
    // Prevent link navigation when button is clicked
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    try {
      // Always use discountedPrice if present
      const itemToAdd = {
        ...item,
        price: item.discountedPrice ?? item.price,
      }
      const result = await addItem(itemToAdd, quantity)

      if (!result.success) {
        // Translate the error message
        let errorMessage = result.message || 'Failed to add item to cart'
        if (errorMessage === 'You cant add it to cart, change color or size') {
          errorMessage = t(
            'Product.You cant add it to cart, change color or size'
          )
        }

        toast({
          variant: 'destructive',
          description: errorMessage,
        })
        return
      }

      router.push(`/checkout`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'An unexpected error occurred',
      })
    }
  }

  return minimal ? (
    <Button
      className='rounded-full w-auto font-semibold shadow-sm hover:shadow-md transition-all border-2 border-primary/80 dark:border-primary/60 dark:hover:border-primary'
      onClick={(e) => {
        handleAddToCart(e)
      }}
    >
      {t('Product.Add to Cart')}
    </Button>
  ) : (
    <div className='w-full space-y-2'>
      <Select
        value={quantity.toString()}
        onValueChange={(i) => setQuantity(Number(i))}
      >
        <SelectTrigger className=''>
          <SelectValue>
            {t('Product.Quantity')}: {quantity}
          </SelectValue>
        </SelectTrigger>
        <SelectContent position='popper'>
          {Array.from({ length: getCountInStockForSelectedSize() }).map(
            (_, i) => (
              <SelectItem key={i + 1} value={`${i + 1}`}>
                {i + 1}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>{' '}
      <Button
        className='rounded-full w-full'
        type='button'
        onClick={handleAddToCart}
      >
        {t('Product.Add to Cart')}
      </Button>{' '}
      <Button
        variant='secondary'
        onClick={handleBuyNow}
        className='w-full rounded-full '
      >
        {t('Product.Buy Now')}
      </Button>
    </div>
  )
}
