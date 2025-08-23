'use client'

import React, { useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import ProductCard from './product-card'
import { useLocale } from 'next-intl'

interface ProductSliderProps {
  title?: string
  products: IProduct[]
  href?: string
  linkText?: string
  hideDetails?: boolean
}

const ProductSlider: React.FC<ProductSliderProps> = ({
  title,
  products,
  href,
  linkText,
  hideDetails = false,
}) => {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
    direction: isRtl ? 'rtl' : 'ltr',
    breakpoints: {
      '(max-width: 1200px)': { slidesToScroll: 1 },
      '(max-width: 768px)': { slidesToScroll: 1 },
      '(max-width: 640px)': { slidesToScroll: 1 },
    },
  })

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  if (!products || products.length === 0) {
    return (
      <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
        No products available.
      </div>
    )
  }

  return (
    <section
      aria-label={title || 'Product Slider'}
      className='sm:my-6 md:my-10 dark:bg-zinc-900/50 rounded-md'
    >
      <div className='flex justify-between items-center mb-4 px-2 sm:px-6'>
        {title && <h2 className='text-xl font-semibold'>{title}</h2>}

        {href && (
          <Link
            href={href}
            className='flex items-center text-sm font-medium text-primary hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-primary transition-colors'
            aria-label={`View all products in ${title}`}
          >
            {linkText ?? 'View All'}
            <ChevronRightIcon className='ml-1 h-4 w-4' />
          </Link>
        )}
      </div>

      <div className='relative px-2 sm:px-6'>
        <div
          className='overflow-hidden scrollbar-hide'
          ref={emblaRef}
          role='list'
          aria-live='polite'
        >
          <div className='flex gap-3 pl-1 pr-8'>
            {products.map((product) => (
              <div
                key={product._id}
                className='w-[75vw] max-w-[280px] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] flex-shrink-0 px-1 sm:px-2'
                role='listitem'
              >
                <ProductCard
                  product={product}
                  hideDetails={hideDetails}
                  hideBorder={false}
                  className='h-full flex flex-col'
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={scrollPrev}
          aria-label='Scroll left'
          className='absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/90 backdrop-blur-sm dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-md'
          disabled={!emblaApi}
        >
          <ChevronLeftIcon className='h-5 w-5' />
        </Button>

        <Button
          variant='outline'
          size='icon'
          onClick={scrollNext}
          aria-label='Scroll right'
          className='absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full bg-background/90 backdrop-blur-sm dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-md'
          disabled={!emblaApi}
        >
          <ChevronRightIcon className='h-5 w-5' />
        </Button>
      </div>
    </section>
  )
}

export default ProductSlider
