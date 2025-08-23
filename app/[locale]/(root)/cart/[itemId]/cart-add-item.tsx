'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CheckCircle2Icon,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/currency'
import type { OrderItem } from '@/types'

// Enhanced price change state interface
interface PriceChangeState {
  hasChanges: boolean
  isProcessing: boolean
  priceChanges: Array<{
    item: OrderItem
    oldPrice: number
    newPrice: number
    priceChange: number
    changeType: 'increase' | 'decrease'
  }>
}

export default function CartAddItem({ itemId }: { itemId: string }) {
  const {
    cart: { items, itemsPrice },
    refreshCartStock,
    refreshCartPrices,
  } = useCartStore()
  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()
  const item = items.find((x) => x.clientId === itemId)

  const t = useTranslations()

  // Enhanced state management
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [priceChangeInfo, setPriceChangeInfo] = useState<PriceChangeState>({
    hasChanges: false,
    isProcessing: false,
    priceChanges: [],
  })

  // Enhanced price and stock checking - same as cart sidebar
  const checkPricesAndStock = useCallback(async () => {
    if (items.length === 0) return

    setIsRefreshing(true)
    setPriceChangeInfo((prev) => ({ ...prev, isProcessing: true }))

    try {
      // Check for price changes first
      const priceResult = await refreshCartPrices()

      if (priceResult.hasChanges) {
        setPriceChangeInfo({
          hasChanges: true,
          isProcessing: false,
          priceChanges: priceResult.priceChanges,
        })

        // Enhanced notification based on changes
        const totalIncreases = priceResult.priceChanges.filter(
          (c) => c.changeType === 'increase'
        ).length
        const totalDecreases = priceResult.priceChanges.filter(
          (c) => c.changeType === 'decrease'
        ).length
        const totalIncrease = priceResult.priceChanges
          .filter((c) => c.changeType === 'increase')
          .reduce((sum, c) => sum + c.priceChange, 0)
        const totalDecrease = priceResult.priceChanges
          .filter((c) => c.changeType === 'decrease')
          .reduce((sum, c) => sum + c.priceChange, 0)

        if (totalIncreases > 0 && totalDecreases > 0) {
          toast({
            title: t('Cart.Price and Discount Changes Detected'),
            description: `${totalIncreases} ${t('Cart.items increased')}, ${totalDecreases} ${t('Cart.items decreased')}. ${t('Cart.Net change')}: ${formatPrice(totalIncrease - totalDecrease)}`,
            variant: 'default',
            duration: 6000,
          })
        } else if (totalIncreases > 0) {
          toast({
            title: t('Cart.Price Changes Detected'),
            description: `${totalIncreases} ${t('Cart.items have increased by')} ${formatPrice(totalIncrease)} ${t('Cart.due to price or discount changes')}`,
            variant: 'destructive',
            duration: 6000,
          })
        } else {
          toast({
            title: t('Cart.Price Changes Detected'),
            description: `${totalDecreases} ${t('Cart.items have decreased by')} ${formatPrice(totalDecrease)} ${t('Cart.due to price or discount changes')}`,
            variant: 'default',
            duration: 6000,
          })
        }
      } else {
        setPriceChangeInfo((prev) => ({ ...prev, isProcessing: false }))
      }

      // Then refresh stock
      await refreshCartStock()
    } catch (error) {
      console.error('Failed to check prices and stock:', error)
      toast({
        title: t('Cart.Error'),
        description: t('Cart.Failed to update cart information'),
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
      setPriceChangeInfo((prev) => ({ ...prev, isProcessing: false }))
    }
  }, [items.length, refreshCartPrices, refreshCartStock, t])

  const dismissPriceChanges = useCallback(() => {
    setPriceChangeInfo({
      hasChanges: false,
      isProcessing: false,
      priceChanges: [],
    })
    toast({
      title: t('Cart.Price Changes Accepted'),
      description: t('Cart.Your cart has been updated with current prices'),
      variant: 'default',
    })
  }, [t])

  // Auto-refresh on component mount
  useEffect(() => {
    if (items.length > 0) {
      checkPricesAndStock()
    }
  }, [items.length, checkPricesAndStock])

  if (!item) return notFound()

  return (
    <div>
      {/* Enhanced Price Change Notification */}
      {priceChangeInfo.hasChanges && (
        <div className='mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md'>
          <div className='flex items-start gap-2'>
            <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0' />
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm font-medium text-amber-800 dark:text-amber-200 mb-1'>
                {t('Cart.Price Changes Detected')}
              </h3>
              <div className='space-y-1 mb-2 max-h-20 overflow-y-auto'>
                {priceChangeInfo.priceChanges.map((change, index) => (
                  <div
                    key={index}
                    className='text-xs text-amber-700 dark:text-amber-300'
                  >
                    <span className='font-medium'>{change.item.name}</span>
                    {'  '}
                    <span
                      className={cn(
                        'font-medium',
                        change.changeType === 'increase'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      )}
                    >
                      {change.changeType === 'increase' ? '+' : '-'}
                      {formatPrice(change.priceChange)}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                size='sm'
                variant='outline'
                onClick={dismissPriceChanges}
                disabled={priceChangeInfo.isProcessing}
                className='h-6 px-2 text-xs bg-white dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/70'
              >
                {priceChangeInfo.isProcessing ? (
                  <>
                    <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                    {t('Cart.Processing')}
                  </>
                ) : (
                  t('Cart.Accept Changes')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 md:gap-4'>
        <Card className='w-full rounded-none'>
          <CardContent className='flex h-full items-center justify-center  gap-3 py-4'>
            <Link href={`/product/${item.slug}`}>
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Link>
            <div>
              <h3 className='text-xl font-bold flex gap-2 my-2'>
                <CheckCircle2Icon className='h-6 w-6 text-green-700' />
                {t('Cart.Added to cart')}
              </h3>
              <p className='text-sm'>
                <span className='font-bold'> {t('Cart.Color')}: </span>{' '}
                {item.color ?? '-'}
              </p>
              <p className='text-sm'>
                <span className='font-bold'> {t('Cart.Size')}: </span>{' '}
                {item.size ?? '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className='w-full rounded-none'>
          <CardContent className='p-4 h-full'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='flex justify-center items-center'>
                {itemsPrice < freeShippingMinPrice ? (
                  <div className='text-center '>
                    {t('Cart.Add')}{' '}
                    <span className='text-green-700'>
                      <ProductPrice
                        price={freeShippingMinPrice - itemsPrice}
                        plain
                      />
                    </span>{' '}
                    {t(
                      'Cart.of eligible items to your order to qualify for FREE Shipping'
                    )}
                  </div>
                ) : (
                  <div className='flex items-center'>
                    <div>
                      <span className='text-green-700'>
                        Your order qualifies for FREE Shipping.
                      </span>{' '}
                      Choose this option at checkout.
                    </div>
                  </div>
                )}
              </div>
              <div className='lg:border-l lg:border-muted lg:pl-3 flex flex-col items-center gap-3  '>
                <div className='flex gap-3'>
                  <span className='text-lg font-bold'>Cart Subtotal:</span>
                  <ProductPrice className='text-2xl' price={itemsPrice} />
                </div>

                {/* Refresh Button */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={checkPricesAndStock}
                  disabled={isRefreshing}
                  className='w-full flex items-center gap-2'
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      {t('Cart.Refreshing')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className='h-4 w-4' />
                      {t('Cart.Refresh Cart')}
                    </>
                  )}
                </Button>

                <Link
                  href='/checkout'
                  className={cn(buttonVariants(), 'rounded-full w-full')}
                >
                  Proceed to checkout (
                  {items.reduce((a, c) => a + c.quantity, 0)} items)
                </Link>
                <Link
                  href='/cart'
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'rounded-full w-full'
                  )}
                >
                  {t('Cart.Go to Cart')}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <BrowsingHistoryList />
    </div>
  )
}
