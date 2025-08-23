'use client'

import EmptyCart from '@/components/shared/cart/empty-cart'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useCartStore from '@/hooks/use-cart-store'
import { TrashIcon, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/currency'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import ProductPrice from '@/components/shared/product/product-price'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  isCartReadyForCheckout,
  validateCartClientSide,
} from '@/lib/cart-validation-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OrderItem } from '@/types'

// Enhanced validation interfaces - same as cart sidebar
interface ValidationState {
  isValidating: boolean
  hasErrors: boolean
  errors: string[]
  invalidItems: string[]
  stockIssues: Array<{
    itemId: string
    itemName: string
    availableStock: number
    requestedQuantity: number
  }>
}

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

// Custom validation hook - same as cart sidebar
const useCartValidation = (items: OrderItem[]): ValidationState => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    hasErrors: false,
    errors: [],
    invalidItems: [],
    stockIssues: [],
  })

  const validateCart = useCallback(async () => {
    if (items.length === 0) {
      setValidationState({
        isValidating: false,
        hasErrors: false,
        errors: [],
        invalidItems: [],
        stockIssues: [],
      })
      return
    }

    setValidationState((prev) => ({ ...prev, isValidating: true }))

    const clientValidation = validateCartClientSide({
      items,
      itemsPrice: 0, // Will be calculated
      totalPrice: 0, // Will be calculated
      taxPrice: undefined,
      shippingPrice: undefined,
      paymentMethod: undefined,
      shippingAddress: undefined,
      deliveryDateIndex: undefined,
    })

    const stockIssues: ValidationState['stockIssues'] = []

    // Enhanced stock validation
    items.forEach((item) => {
      const colorObj = item.colors?.find((c) => c.color === item.color)
      const sizeObj = colorObj?.sizes?.find((s) => s.size === item.size)

      if (sizeObj && sizeObj.countInStock < item.quantity) {
        stockIssues.push({
          itemId: item.clientId || item.product,
          itemName: item.name,
          availableStock: sizeObj.countInStock,
          requestedQuantity: item.quantity,
        })
      }
    })

    setValidationState({
      isValidating: false,
      hasErrors: !clientValidation.isValid || stockIssues.length > 0,
      errors: [...clientValidation.errors, ...clientValidation.warnings],
      invalidItems: clientValidation.invalidItems.map(
        (item) => item.clientId || item.product
      ),
      stockIssues,
    })
  }, [items])

  useEffect(() => {
    validateCart()
  }, [validateCart])

  return validationState
}

export default function Cart() {
  const {
    cart: { items, itemsPrice, taxPrice, shippingPrice, totalPrice },
    removeItem,
    updateItem,
    refreshCartStock,
    refreshCartPrices,
  } = useCartStore()

  const t = useTranslations()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Enhanced state management
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [priceChangeInfo, setPriceChangeInfo] = useState<PriceChangeState>({
    hasChanges: false,
    isProcessing: false,
    priceChanges: [],
  })

  // Enhanced validation hook - same as cart sidebar
  const validation = useCartValidation(items)

  // Legacy cart validation for backward compatibility
  const cartIsReady = isCartReadyForCheckout({
    items,
    itemsPrice,
    totalPrice,
    taxPrice: taxPrice || 0,
    shippingPrice: shippingPrice || 0,
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
  }, [items.length, refreshCartPrices, refreshCartStock, t, toast])

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
  }, [t, toast])

  // Auto-refresh on component mount
  useEffect(() => {
    if (items.length > 0) {
      checkPricesAndStock()
    }
  }, [items.length, checkPricesAndStock])

  // Handle error messages from checkout redirect
  useEffect(() => {
    const error = searchParams?.get('error')
    if (error) {
      let errorMessage = ''

      switch (error) {
        case 'empty-cart':
          errorMessage = t('Cart.Your cart is empty')
          break
        case 'invalid-quantities':
          errorMessage = t('Cart.Please fix invalid quantities before checkout')
          break
        case 'invalid-cart':
          errorMessage = t(
            'Cart.Invalid cart data Please refresh and try again'
          )
          break
        default:
          errorMessage = t(
            'Cart.Unable to proceed to checkout Please check your cart'
          )
      }

      if (errorMessage) {
        toast({
          description: errorMessage,
          variant: 'destructive',
        })

        // Clean up the URL by removing the error parameter
        const newSearchParams = new URLSearchParams(
          searchParams ? searchParams.toString() : ''
        )
        newSearchParams.delete('error')
        const newUrl = `/cart${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`
        router.replace(newUrl)
      }
    }
  }, [searchParams, toast, t, router])

  if (items.length === 0) {
    return <EmptyCart />
  }

  return (
    <div className='container py-6 md:py-8 lg:py-10'>
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
              {t('Cart.Shopping Cart')}
            </h1>
            <p className='text-muted-foreground'>
              {items.length} {items.length === 1 ? 'item' : 'items'} in your
              cart
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={checkPricesAndStock}
              disabled={isRefreshing}
              className='flex items-center gap-2'
            >
              {isRefreshing ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('Cart.Refreshing')}
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4' />
                  {t('Cart.Refresh')}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Enhanced Price Change Notification */}
        {priceChangeInfo.hasChanges && (
          <div className='mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md'>
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

        {/* Enhanced Validation Notifications - same as cart sidebar */}
        {validation.hasErrors && (
          <div className='mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0' />
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                    {t('Cart.Cart Issues Detected')}
                  </h3>
                  <Badge
                    variant='destructive'
                    className='text-xs px-1.5 py-0.5'
                  >
                    {validation.stockIssues.length + validation.errors.length}
                  </Badge>
                </div>
                <div className='space-y-1 text-xs text-red-700 dark:text-red-300'>
                  {validation.stockIssues.map((issue, index) => (
                    <div key={index}>
                      <span className='font-medium'>{issue.itemName}</span>
                      {' - '}
                      {t('Cart.Only')} {issue.availableStock}{' '}
                      {t('Cart.in stock')}, {t('Cart.requested')}{' '}
                      {issue.requestedQuantity}
                    </div>
                  ))}
                  {validation.errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Cart Items */}
        <div className='lg:col-span-2'>
          <Card className='shadow-sm'>
            <CardHeader className='py-4 px-6 border-b'>
              <CardTitle className='text-lg'>{t('Cart.Items')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'></TableHead>
                      <TableHead>{t('Cart.Product')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Cart.Price')}
                      </TableHead>
                      <TableHead>{t('Cart.Quantity')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Cart.Total')}
                      </TableHead>
                      <TableHead className='w-[50px]'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      // Enhanced validation for individual items - same as cart sidebar
                      const hasValidationIssue =
                        validation.invalidItems.includes(
                          item.clientId || item.product
                        )
                      const stockIssue = validation.stockIssues.find(
                        (issue) =>
                          issue.itemId === (item.clientId || item.product)
                      )

                      return (
                        <TableRow
                          key={`${item.clientId}-${item.quantity}`}
                          className={cn(
                            'hover:bg-muted/30 transition-colors',
                            hasValidationIssue &&
                              'bg-red-50/50 dark:bg-red-900/10'
                          )}
                        >
                          <TableCell className='p-2'>
                            <Link
                              href={`/product/${item.slug}`}
                              className='block w-[80px] h-[80px] relative overflow-hidden rounded-md border'
                            >
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes='80px'
                                className='object-contain'
                              />
                              {hasValidationIssue && (
                                <div className='absolute inset-0 bg-red-500/20 flex items-center justify-center'>
                                  <AlertTriangle className='h-4 w-4 text-red-600' />
                                </div>
                              )}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/product/${item.slug}`}
                              className='font-medium hover:text-primary transition-colors hover:underline'
                            >
                              {item.name}
                            </Link>
                            <div className='text-sm text-muted-foreground mt-1'>
                              {item.color && (
                                <span className='mr-2'>
                                  {t('Cart.Color')}: {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span>
                                  {t('Cart.Size')}: {item.size}
                                </span>
                              )}
                            </div>

                            {/* Stock warning - same as cart sidebar */}
                            {stockIssue && (
                              <div className='text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1'>
                                <AlertTriangle className='h-3 w-3' />
                                {t('Cart.Only')} {stockIssue.availableStock}{' '}
                                {t('Cart.available')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            <ProductPrice
                              price={item.price}
                              discountedPrice={item.discountedPrice}
                              plain
                            />
                            {item.discountedPrice && item.discount && (
                              <div className='text-xs text-green-600 mt-1'>
                                {item.discount}% {t('Cart.discount applied')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.quantity.toString()}
                              onValueChange={(value) => {
                                const newQuantity = Number(value)

                                // Enhanced validation before update
                                if (
                                  newQuantity < 0 ||
                                  !Number.isInteger(newQuantity)
                                ) {
                                  toast({
                                    title: t('Cart.Invalid Quantity'),
                                    description: t(
                                      'Cart.Quantity must be a positive whole number'
                                    ),
                                    variant: 'destructive',
                                  })
                                  return
                                }

                                // Check stock availability
                                const colorObj = item.colors?.find(
                                  (c) => c.color === item.color
                                )
                                const sizeObj = colorObj?.sizes?.find(
                                  (s) => s.size === item.size
                                )

                                if (
                                  newQuantity > 0 &&
                                  sizeObj &&
                                  sizeObj.countInStock < newQuantity
                                ) {
                                  toast({
                                    title: t('Cart.Insufficient Stock'),
                                    description: `${t('Cart.Only')} ${sizeObj.countInStock} ${t('Cart.items available for')} ${item.name}`,
                                    variant: 'destructive',
                                  })
                                  return
                                }

                                updateItem(item, newQuantity)

                                if (newQuantity === 0) {
                                  toast({
                                    title: t('Cart.Item Removed'),
                                    description: `${item.name} ${t('Cart.has been removed from your cart')}`,
                                    variant: 'default',
                                  })
                                }
                              }}
                              disabled={isRefreshing}
                            >
                              <SelectTrigger
                                className={cn(
                                  'w-20',
                                  hasValidationIssue &&
                                    'border-red-300 bg-red-50 dark:bg-red-900/20'
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({
                                  length: Math.min(
                                    item.colors
                                      .find((c) => c.color === item.color)
                                      ?.sizes.find((s) => s.size === item.size)
                                      ?.countInStock || 0,
                                    10 // Limit to 10 for UX
                                  ),
                                }).map((_, i) => (
                                  <SelectItem
                                    key={i + 1}
                                    value={(i + 1).toString()}
                                  >
                                    {i + 1}
                                  </SelectItem>
                                ))}
                                <SelectItem value='0' className='text-red-600'>
                                  {t('Cart.Remove')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            <ProductPrice
                              price={
                                (item.discountedPrice || item.price) *
                                item.quantity
                              }
                              plain
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => removeItem(item)}
                              className='text-muted-foreground hover:text-destructive transition-colors'
                              aria-label='Remove item'
                              disabled={isRefreshing}
                            >
                              <TrashIcon className='w-4 h-4' />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className='shadow-sm sticky top-24'>
            <CardHeader className='py-4 px-6 border-b'>
              <CardTitle className='text-lg'>
                {t('Cart.Order Summary')}
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6 space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t('Cart.Subtotal')} ({items.length}{' '}
                    {items.length === 1 ? t('Cart.item') : t('Cart.items')})
                  </span>
                  <span>{formatPrice(itemsPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t('Cart.Shipping')}
                  </span>
                  <span>{formatPrice(shippingPrice ?? 0)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t('Cart.Tax')}</span>
                  <span>{formatPrice(taxPrice ?? 0)}</span>
                </div>
              </div>

              <Separator />

              <div className='flex justify-between text-lg font-bold'>
                <span>{t('Cart.Total')}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <div className='pt-4'>
                {/* Enhanced validation warning - same as cart sidebar */}
                {validation.hasErrors && (
                  <div className='mb-3 p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm'>
                    <div className='flex items-center gap-2 mb-1'>
                      <AlertTriangle className='h-4 w-4' />
                      <span className='font-medium'>
                        {t('Cart.Cart Issues')}
                      </span>
                      <Badge
                        variant='destructive'
                        className='text-xs px-1.5 py-0.5'
                      >
                        {validation.stockIssues.length +
                          validation.errors.length}
                      </Badge>
                    </div>
                    {validation.stockIssues.map((issue, index) => (
                      <div key={index} className='text-xs'>
                        • {issue.itemName}: {t('Cart.Only')}{' '}
                        {issue.availableStock} {t('Cart.in stock')},{' '}
                        {t('Cart.requested')} {issue.requestedQuantity}
                      </div>
                    ))}
                    {validation.errors.map((error, index) => (
                      <div key={index} className='text-xs'>
                        • {error}
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href='/checkout'
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full',
                    (validation.hasErrors || !cartIsReady || isRefreshing) &&
                      'opacity-50 pointer-events-none'
                  )}
                  onClick={(e) => {
                    if (validation.hasErrors || !cartIsReady || isRefreshing) {
                      e.preventDefault()

                      if (isRefreshing) {
                        toast({
                          title: t('Cart.Please Wait'),
                          description: t(
                            'Cart.Cart is being refreshed, please wait'
                          ),
                          variant: 'default',
                        })
                      } else if (validation.hasErrors) {
                        toast({
                          title: t('Cart.Fix Issues to Checkout'),
                          description: t(
                            'Cart.Please fix cart issues before checkout'
                          ),
                          variant: 'destructive',
                        })
                      } else {
                        toast({
                          description: t(
                            'Cart.Please fix invalid quantities before checkout'
                          ),
                          variant: 'destructive',
                        })
                      }
                      return
                    }
                  }}
                >
                  {validation.hasErrors ? (
                    <>
                      <AlertTriangle className='h-4 w-4 mr-2' />
                      {t('Cart.Fix Issues to Checkout')}
                    </>
                  ) : isRefreshing ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      {t('Cart.Updating')}
                    </>
                  ) : (
                    t('Cart.Checkout')
                  )}
                </Link>
              </div>

              <div className='pt-2 text-center'>
                <Link href='/' className='text-primary text-sm hover:underline'>
                  {t('Cart.Continue shopping')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
