'use client'

import useCartStore from '@/hooks/use-cart-store'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Button, buttonVariants } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  ShoppingBag,
  TrashIcon,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import useSettingStore from '@/hooks/use-setting-store'
import ProductPrice from './product/product-price'
import { useLocale, useTranslations } from 'next-intl'
import { getDirection } from '@/i18n-config'
import { useCartSidebarStore } from '@/hooks/use-cart-sidebar-store'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import type { OrderItem } from '@/types'
import {
  validateCartClientSide,
  isCartReadyForCheckout,
} from '@/lib/cart-validation-client'
import { Badge } from '../ui/badge'

// Memoized quantity selector component to prevent unnecessary re-renders
const QuantitySelector = memo(
  ({
    item,
    hasValidationIssue,
    isRefreshing,
    onQuantityUpdate,
    t,
  }: {
    item: OrderItem
    hasValidationIssue: boolean
    isRefreshing: boolean
    onQuantityUpdate: (item: OrderItem, quantity: number) => void
    t: (key: string) => string
  }) => {
    const maxStock = Math.min(
      item.colors
        ?.find((c) => c.color === item.color)
        ?.sizes.find((s) => s.size === item.size)?.countInStock || 0,
      10 // Limit to 10 for UX
    )

    const handleValueChange = useCallback(
      (value: string) => {
        onQuantityUpdate(item, Number(value))
      },
      [item, onQuantityUpdate]
    )

    return (
      <Select
        value={item.quantity.toString()}
        onValueChange={handleValueChange}
        disabled={isRefreshing}
      >
        <SelectTrigger
          className={cn(
            'text-xs h-7 w-14 px-2',
            hasValidationIssue && 'border-red-300 bg-red-50 dark:bg-red-900/20'
          )}
          onFocus={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className='z-[999] bg-white dark:bg-gray-900'
          position='popper'
          side='bottom'
          align='center'
          sideOffset={4}
          avoidCollisions={true}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {Array.from({ length: maxStock }).map((_, i) => (
            <SelectItem value={(i + 1).toString()} key={i + 1}>
              {i + 1}
            </SelectItem>
          ))}
          <SelectItem value='0' className='text-red-600'>
            {t('Cart.Remove')}
          </SelectItem>
        </SelectContent>
      </Select>
    )
  }
)

QuantitySelector.displayName = 'QuantitySelector'

// Enhanced validation interfaces
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

// Custom hooks for cart operations
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

export default function CartSidebar() {
  const { isOpen, closeSidebar } = useCartSidebarStore()
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
    clearCart,
    refreshCartStock,
    refreshCartPrices,
  } = useCartStore()
  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()
  const locale = useLocale()
  const rtl = getDirection(locale) === 'rtl'
  const router = useRouter()

  // Enhanced state management
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [priceChangeInfo, setPriceChangeInfo] = useState<PriceChangeState>({
    hasChanges: false,
    isProcessing: false,
    priceChanges: [],
  })

  // Validation hook
  const validation = useCartValidation(items)

  // Memoized calculations
  const cartSummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const hasValidItems = items.length > 0 && !validation.hasErrors
    const canCheckout =
      hasValidItems &&
      isCartReadyForCheckout({
        items,
        itemsPrice,
        totalPrice: itemsPrice,
        taxPrice: undefined,
        shippingPrice: undefined,
        paymentMethod: undefined,
        shippingAddress: undefined,
        deliveryDateIndex: undefined,
      })

    return {
      totalItems,
      hasValidItems,
      canCheckout,
      freeShippingRemaining: Math.max(0, freeShippingMinPrice - itemsPrice),
    }
  }, [items, validation.hasErrors, itemsPrice, freeShippingMinPrice])

  // Enhanced price and stock checking
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

  // Auto-refresh prices when cart sidebar opens
  useEffect(() => {
    if (isOpen && items.length > 0) {
      checkPricesAndStock()
    }
  }, [isOpen, items.length, checkPricesAndStock])

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

  // Enhanced quantity update with validation
  const handleQuantityUpdate = useCallback(
    async (item: OrderItem, newQuantity: number) => {
      // Validate quantity before update
      if (newQuantity < 0 || !Number.isInteger(newQuantity)) {
        toast({
          title: t('Cart.Invalid Quantity'),
          description: t('Cart.Quantity must be a positive whole number'),
          variant: 'destructive',
        })
        return
      }

      // Check stock availability
      const colorObj = item.colors?.find((c) => c.color === item.color)
      const sizeObj = colorObj?.sizes?.find((s) => s.size === item.size)

      if (newQuantity > 0 && sizeObj && sizeObj.countInStock < newQuantity) {
        toast({
          title: t('Cart.Insufficient Stock'),
          description: `${t('Cart.Only')} ${sizeObj.countInStock} ${t('Cart.items available for')} ${item.name}`,
          variant: 'destructive',
        })
        return
      }

      try {
        await updateItem(item, newQuantity)

        if (newQuantity === 0) {
          toast({
            title: t('Cart.Item Removed'),
            description: `${item.name} ${t('Cart.has been removed from your cart')}`,
            variant: 'default',
          })
        }
      } catch (error) {
        console.error('Failed to update item quantity:', error)
        toast({
          title: t('Cart.Error'),
          description: t('Cart.Failed to update item quantity'),
          variant: 'destructive',
        })
      }
    },
    [updateItem, t]
  )

  // Auto-refresh when sidebar opens
  useEffect(() => {
    if (isOpen && items.length > 0) {
      checkPricesAndStock()
    }
  }, [isOpen, items.length, checkPricesAndStock])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className='fixed inset-0 bg-black/30 dark:bg-black/50 z-[100] backdrop-blur-sm'
          />

          {/* Enhanced Sidebar */}
          <motion.div
            initial={{ x: rtl ? -320 : 320 }}
            animate={{ x: 0 }}
            exit={{ x: rtl ? -320 : 320 }}
            transition={{ type: 'spring', damping: 20 }}
            className={cn(
              'fixed top-0 bottom-0 z-[101] w-full max-w-[280px] xs:max-w-[320px] bg-background shadow-xl',
              rtl ? 'left-0' : 'right-0',
              'border-l border-border/30'
            )}
          >
            <div className='flex flex-col h-full'>
              {/* Enhanced Header */}
              <div className='p-4 bg-header text-white flex items-center justify-between relative'>
                <div className='flex items-center gap-2'>
                  <ShoppingBag className='h-5 w-5' />
                  <h2 className='font-semibold text-lg'>
                    {t('Cart.Shopping Cart')}
                  </h2>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>
                      {cartSummary.totalItems}{' '}
                      {cartSummary.totalItems === 1
                        ? t('Cart.item')
                        : t('Cart.items')}
                    </span>
                    {validation.hasErrors && (
                      <Badge
                        variant='destructive'
                        className='text-xs px-1.5 py-0.5'
                      >
                        {validation.stockIssues.length +
                          validation.errors.length}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={closeSidebar}
                    className='h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/10'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                {/* Loading indicator */}
                {(isRefreshing || priceChangeInfo.isProcessing) && (
                  <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-white/20'>
                    <div className='h-full bg-white animate-pulse' />
                  </div>
                )}
              </div>

              {/* Enhanced Validation Notifications */}
              {validation.hasErrors && (
                <div className='p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-medium text-red-800 dark:text-red-200 mb-1'>
                        {t('Cart.Cart Issues Detected')}
                      </h3>
                      <div className='space-y-1 text-xs text-red-700 dark:text-red-300'>
                        {validation.stockIssues.map((issue, index) => (
                          <div key={index}>
                            <span className='font-medium'>
                              {issue.itemName}
                            </span>
                            {' - '}
                            {t('Cart.Only')} {issue.availableStock}{' '}
                            {t('Cart.in stock')},{t('Cart.requested')}{' '}
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

              {/* Enhanced Price Change Notification */}
              {priceChangeInfo.hasChanges && (
                <div className='p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800'>
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
                            <span className='font-medium'>
                              {change.item.name}
                            </span>
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

              {/* Enhanced Cart Items */}
              <ScrollArea className='flex-1 overflow-y-auto py-2'>
                <div className='flex flex-col divide-y divide-border/30'>
                  {items.length === 0 ? (
                    <div className='p-8 text-center'>
                      <ShoppingBag className='h-12 w-12 mx-auto text-muted-foreground/50 mb-3' />
                      <p className='text-muted-foreground text-sm'>
                        {t('Cart.Your Shopping Cart is empty')}
                      </p>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={closeSidebar}
                        className='mt-2'
                      >
                        {t('Cart.Continue Shopping')}
                      </Button>
                    </div>
                  ) : (
                    items.map((item) => {
                      const hasValidationIssue =
                        validation.invalidItems.includes(
                          item.clientId || item.product
                        )
                      const stockIssue = validation.stockIssues.find(
                        (issue) =>
                          issue.itemId === (item.clientId || item.product)
                      )

                      return (
                        <div
                          key={`${item.clientId}-${item.quantity}`}
                          className={cn(
                            'p-3 hover:bg-muted/20 transition-colors',
                            hasValidationIssue &&
                              'bg-red-50/50 dark:bg-red-900/10'
                          )}
                          onMouseDown={(e) => {
                            // Prevent mouse events from interfering with Select
                            if (
                              (e.target as HTMLElement).closest(
                                '[data-radix-select-trigger]'
                              )
                            ) {
                              e.stopPropagation()
                            }
                          }}
                        >
                          <div className='flex gap-3 items-center'>
                            <Link
                              href={`/product/${item.slug}`}
                              className='shrink-0'
                              onClick={closeSidebar}
                            >
                              <div className='relative h-16 w-16 rounded-md overflow-hidden border border-border/30'>
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes='64px'
                                  className='object-contain'
                                />
                                {hasValidationIssue && (
                                  <div className='absolute inset-0 bg-red-500/20 flex items-center justify-center'>
                                    <AlertTriangle className='h-4 w-4 text-red-600' />
                                  </div>
                                )}
                              </div>
                            </Link>

                            <div className='flex-1 min-w-0'>
                              <Link
                                href={`/product/${item.slug}`}
                                className='font-medium text-sm line-clamp-1 hover:text-primary transition-colors'
                                onClick={closeSidebar}
                              >
                                {item.name}
                              </Link>

                              <div className='text-muted-foreground text-xs mt-1'>
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

                              {/* Stock warning */}
                              {stockIssue && (
                                <div className='text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1'>
                                  <AlertTriangle className='h-3 w-3' />
                                  {t('Cart.Only')} {stockIssue.availableStock}{' '}
                                  {t('Cart.available')}
                                </div>
                              )}

                              <div className='flex items-center justify-between mt-2'>
                                <div className='font-medium text-sm'>
                                  <ProductPrice
                                    price={item.price}
                                    discountedPrice={item.discountedPrice}
                                    plain
                                  />
                                  {item.discountedPrice && item.discount && (
                                    <div className='text-xs text-green-600 mt-1'>
                                      {item.discount}%{' '}
                                      {t('Cart.discount applied')}
                                    </div>
                                  )}
                                </div>

                                <div className='flex items-center gap-2'>
                                  <QuantitySelector
                                    item={item}
                                    hasValidationIssue={hasValidationIssue}
                                    isRefreshing={isRefreshing}
                                    onQuantityUpdate={handleQuantityUpdate}
                                    t={t}
                                  />

                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                                    onClick={() => removeItem(item)}
                                    disabled={isRefreshing}
                                  >
                                    <TrashIcon className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Enhanced Summary and Checkout */}
              <div className='p-4 bg-muted/30 border-t border-border/30'>
                {items.length > 0 && (
                  <>
                    {/* Enhanced free shipping message */}
                    {cartSummary.freeShippingRemaining > 0 ? (
                      <div className='text-sm mb-3 p-2 bg-primary/10 rounded-md border border-primary/20'>
                        <div className='flex items-center gap-2 mb-1'>
                          <ShoppingBag className='h-4 w-4 text-primary' />
                          <span className='font-medium text-primary'>
                            {t('Cart.Free Shipping Available')}
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {t('Cart.Add')}{' '}
                          <span className='text-primary font-medium'>
                            {formatPrice(cartSummary.freeShippingRemaining)}
                          </span>{' '}
                          {t('Cart.more to qualify for free shipping')}
                        </p>
                        <div className='mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                          <div
                            className='bg-primary h-2 rounded-full transition-all duration-300'
                            style={{
                              width: `${Math.min((itemsPrice / freeShippingMinPrice) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm mb-3 p-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800'>
                        <div className='flex items-center gap-2'>
                          <div className='h-4 w-4 rounded-full bg-green-500 flex items-center justify-center'>
                            <div className='h-2 w-2 bg-white rounded-full' />
                          </div>
                          <span className='font-medium'>
                            {t('Cart.Your order qualifies for FREE Shipping')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Enhanced subtotal */}
                    <div className='flex items-center justify-between mb-4'>
                      <span className='text-muted-foreground'>
                        {t('Cart.Subtotal')} ({cartSummary.totalItems}{' '}
                        {cartSummary.totalItems === 1
                          ? t('Cart.item')
                          : t('Cart.items')}
                        )
                      </span>
                      <span className='font-bold text-lg'>
                        <ProductPrice price={itemsPrice} plain />
                      </span>
                    </div>
                  </>
                )}

                {/* Enhanced Action Buttons */}
                <div className='space-y-2'>
                  <Button
                    type='button'
                    onClick={() => {
                      closeSidebar()
                      router.push('/checkout')
                    }}
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'w-full',
                      (!cartSummary.canCheckout || validation.hasErrors) &&
                        'opacity-50 pointer-events-none'
                    )}
                    disabled={
                      !cartSummary.canCheckout ||
                      validation.hasErrors ||
                      isRefreshing
                    }
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
                      t('Cart.Proceed to Checkout')
                    )}
                  </Button>

                  <Link
                    href='/cart'
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'w-full bg-zinc-800 text-white hover:bg-zinc-400 hover:text-black',
                      items.length === 0 && 'opacity-50 pointer-events-none'
                    )}
                    onClick={closeSidebar}
                  >
                    {t('Cart.Go to Cart')}
                  </Link>

                  {items.length > 0 && (
                    <div className='flex gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={checkPricesAndStock}
                        disabled={isRefreshing}
                        className='flex-1 text-xs'
                      >
                        {isRefreshing ? (
                          <>
                            <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                            {t('Cart.Refreshing')}
                          </>
                        ) : (
                          <>
                            <RefreshCw className='h-3 w-3 mr-1' />
                            {t('Cart.Refresh')}
                          </>
                        )}
                      </Button>

                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          clearCart()
                          closeSidebar()
                        }}
                        disabled={isRefreshing}
                        className='flex-1 text-xs'
                      >
                        {t('Cart.Empty Cart')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
