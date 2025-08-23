'use client'
import useSettingStore from '@/hooks/use-setting-store'
import { cn } from '@/lib/utils'
import { currencyManager, getPriceParts, formatPrice } from '@/lib/currency'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

const ProductPrice = ({
  price,
  discountedPrice,
  className,
  isDeal = false,
  forListing = true,
  plain = false,
}: {
  price: number // Price in NOK (base currency)
  discountedPrice?: number // Discounted price in NOK (base currency)
  isDeal?: boolean
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const { setting, getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()

  // Initialize currency manager with current settings
  useEffect(() => {
    if (
      setting?.availableCurrencies &&
      setting.availableCurrencies.length > 0
    ) {
      currencyManager.init(setting.availableCurrencies, currency.code)
    }
  }, [setting?.availableCurrencies, currency.code])

  const finalPrice = discountedPrice ?? price
  const hasDiscount = discountedPrice !== undefined && discountedPrice < price

  const discountPercent = hasDiscount
    ? Math.round(100 - (discountedPrice! / price) * 100)
    : 0

  // Use the new currency manager for price formatting
  const { integerPart, decimalPart } = getPriceParts(finalPrice)
  const currentCurrency = currencyManager.getCurrentCurrency()

  return plain ? (
    formatPrice(finalPrice)
  ) : isDeal ? (
    <div className='space-y-2'>
      <div className='flex justify-center items-center gap-2'>
        <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
          {discountPercent}% {t('Product.Off')}
        </span>
        <span className='text-red-700 text-xs font-bold'>
          {t('Product.Limited time deal')}
        </span>
      </div>
      <div
        className={`flex ${forListing && 'justify-center'} items-center gap-2`}
      >
        <div className={cn('text-3xl', className)}>
          <span className='text-xs align-super'>{currentCurrency.symbol}</span>
          {integerPart}
          <span className='text-xs align-super'>{decimalPart}</span>
        </div>
        {hasDiscount && (
          <div className='text-muted-foreground text-xs py-2 line-through'>
            {formatPrice(price)}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className=''>
      <div className='flex justify-center gap-3'>
        {hasDiscount && (
          <div className='text-3xl text-orange-700'>-{discountPercent}%</div>
        )}
        <div className={cn('text-3xl', className)}>
          <span className='text-xs align-super'>{currentCurrency.symbol}</span>
          {integerPart}
          <span className='text-xs align-super'>{decimalPart}</span>
        </div>
      </div>
      {hasDiscount && (
        <div className='text-muted-foreground text-xs py-2 line-through'>
          {formatPrice(price)}
        </div>
      )}
    </div>
  )
}

export default ProductPrice
