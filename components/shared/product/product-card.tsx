import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { formatNumber, generateId, round2, cn } from '@/lib/utils'
import { formatPrice } from '@/lib/currency'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import { useTranslations } from 'next-intl'

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
  className,
  hideAddToCartButton = false, // New prop to conditionally hide add to cart button
  hideBrandOnMobile = false, // New prop to conditionally hide brand name on mobile
  isInInfiniteList = false, // New prop to conditionally style for infinite list
}: {
  product: IProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
  className?: string
  hideAddToCartButton?: boolean // New prop to conditionally hide add to cart button
  hideBrandOnMobile?: boolean // New prop to conditionally hide brand name on mobile
  isInInfiniteList?: boolean // New prop to conditionally style for infinite list
}) => {
  const ProductImage = () => (
    <div
      className={cn(
        'relative transform transition-transform duration-700 ease-out hover:scale-105',
        {
          'h-44 sm:h-60': isInInfiniteList, // Mobil: mindre høyde
          'h-52': !isInInfiniteList,
        }
      )}
    >
      {product.images.length > 1 ? (
        <ImageHover
          src={product.images[0]}
          hoverSrc={product.images[1]}
          alt={`${product.name} - ${product.brand} product image with hover view${product.description ? ', ' + product.description.substring(0, 50) + '...' : ''}`}
        />
      ) : (
        <div
          className={cn('relative', {
            'h-40': isInInfiniteList,
            'h-52': !isInInfiniteList,
          })}
        >
          <Image
            src={product.images[0]}
            alt={`${product.name} - ${product.brand} product image${product.description ? ', ' + product.description.substring(0, 50) + '...' : ''}`}
            fill
            sizes='80vw'
            className='object-contain drop-shadow-md'
          />
        </div>
      )}
    </div>
  )

  const discountedPrice = product.discountedPrice ?? undefined

  const ProductDetails = () => {
    const tags = product?.tags || [] // Ensure tags is always an array

    return (
      <div className='flex-1 space-y-2 flex flex-col'>
        <p
          className={cn('font-bold text-foreground dark:text-foreground/90', {
            'hidden sm:block': hideBrandOnMobile,
          })}
        >
          {product.brand}
        </p>
        <p
          className='overflow-hidden text-ellipsis font-medium hover:text-primary transition-colors duration-300 dark:text-foreground/80 dark:hover:text-primary'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.name}
        </p>
        <div
          className={cn('flex gap-2 justify-center', {
            'hidden sm:flex': isInInfiniteList,
          })}
        >
          <Rating rating={product.avgRating} />
          <span className='font-medium'>
            ({formatNumber(product.numReviews)})
          </span>
        </div>

        <div className='mt-auto pt-2'>
          <ProductPrice
            isDeal={tags.includes('todays-deal')}
            price={product.price}
            discountedPrice={discountedPrice} // <--- add this
            forListing
          />
        </div>
      </div>
    )
  }

  const AddButton = () => (
    <div className='w-full text-center transform transition-all duration-300 hover:scale-105 pb-1 lg:block'>
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          size: product.colors[0]?.sizes[0]?.size,
          color: product.colors[0]?.color,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          discountedPrice: product.discountedPrice
            ? round2(product.discountedPrice)
            : undefined,
          discount: product.discount || undefined,
          quantity: 1,
          image: product.images[0],
          colors: product.colors,
        }}
        selectedSize={product.colors[0]?.sizes[0]?.size}
      />
    </div>
  )

  const discountPercent = product.discount ? Math.round(product.discount) : null
  const t = useTranslations()

  return hideBorder ? (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'flex flex-col group card-professional h-full cursor-pointer',
        className,
        {
          'hover:bg-gray-100 dark:hover:bg-gray-800': isInInfiniteList,
          'hover:border-primary': isInInfiniteList,
        }
      )}
      aria-label={`View ${product.name} by ${product.brand} - ${formatPrice(product.discountedPrice ?? product.price)} ${product.discount ? `(${product.discount}% off)` : ''}`}
    >
      {' '}
      <ProductImage />
      {!hideDetails && (
        <>
          <div
            className={cn('flex-1 text-center', {
              'p-2 sm:p-3 pt-3 sm:pt-4': isInInfiniteList, // More padding top for infinite list
              'p-3': !isInInfiniteList,
            })}
          >
            <ProductDetails />
          </div>
          {!hideAddToCart && !hideAddToCartButton && <AddButton />}
        </>
      )}
    </Link>
  ) : (
    <Link
      href={`/product/${product.slug}`}
      aria-label={`View ${product.name} by ${product.brand} - ${formatPrice(product.discountedPrice ?? product.price)} ${product.discount ? `(${product.discount}% off)` : ''}`}
    >
      <Card
        className={cn(
          'flex flex-col group card-professional h-full border-2 border-border/50 hover:border-primary/40 dark:bg-zinc-900 dark:hover:bg-zinc-900 dark:border-zinc-700 dark:hover:border-primary/60 overflow-hidden cursor-pointer',
          className,
          {
            'hover:bg-gray-100 dark:hover:bg-gray-800': isInInfiniteList,
            'hover:border-primary': isInInfiniteList,
          }
        )}
      >
        <CardHeader className='p-2 sm:p-3 flex-shrink-0'>
          <ProductImage />
        </CardHeader>
        {!hideDetails && (
          <>
            <CardContent className='p-2 sm:p-1 flex-1 text-center overflow-y-auto'>
              <ProductDetails />
            </CardContent>{' '}
            <CardFooter className='p-2 pt-1 pb-2 sm:p-3 sm:pt-2 sm:pb-3 flex-shrink-0 mt-auto border-t border-border/10 dark:border-zinc-800'>
              {!hideAddToCart && !hideAddToCartButton && <AddButton />}
            </CardFooter>
          </>
        )}
        {/* Discount Badge */}
        {discountPercent && (
          <div
            className={cn(
              'absolute top-3 left-3 opacity-80 px-2 py-1.5 text-sm font-extrabold text-white rounded-full bg-gradient-to-r from-red-700 to-red-600 shadow-lg',
              'animate-fadeInScale transition-transform duration-300 ease-out group-hover:scale-110'
            )}
            style={{
              animation: 'fadeInScale 0.4s ease-out forwards',
              letterSpacing: '0.02em',
            }}
          >
            {discountPercent}% {t('Product.OFF')}
          </div>
        )}
      </Card>
    </Link>
  )
}

export default ProductCard
