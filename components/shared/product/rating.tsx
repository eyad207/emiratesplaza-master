'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

export default function Rating({
  rating = 0,
  size = 6,
}: {
  rating: number
  size?: number
}) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const fullStars = Math.floor(rating)
  const partialStar = rating % 1
  const emptyStars = 5 - Math.ceil(rating)

  return (
    <div
      className={cn('flex items-center', {
        'flex-row-reverse': isRTL, // Reverse star order for Arabic
      })}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {' '}
      {/* Render stars in correct order for RTL */}
      {isRTL ? (
        // RTL: Empty stars first, then partial, then full stars
        <>
          {[...Array(emptyStars)].map((_, i) => (
            <Star
              key={`empty-${i}`}
              className={`w-${size} h-${size} text-primary`}
            />
          ))}
          {partialStar > 0 && (
            <div className='relative'>
              <Star className={`w-${size} h-${size} text-primary`} />
              <div
                className='absolute top-0 right-0 overflow-hidden'
                style={{ width: `${partialStar * 100}%` }}
              >
                <Star
                  className={`w-${size} h-${size} fill-primary text-primary`}
                />
              </div>
            </div>
          )}
          {[...Array(fullStars)].map((_, i) => (
            <Star
              key={`full-${i}`}
              className={`w-${size} h-${size} fill-primary text-primary`}
            />
          ))}
        </>
      ) : (
        // LTR: Full stars first, then partial, then empty stars
        <>
          {[...Array(fullStars)].map((_, i) => (
            <Star
              key={`full-${i}`}
              className={`w-${size} h-${size} fill-primary text-primary`}
            />
          ))}
          {partialStar > 0 && (
            <div className='relative'>
              <Star className={`w-${size} h-${size} text-primary`} />
              <div
                className='absolute top-0 left-0 overflow-hidden'
                style={{ width: `${partialStar * 100}%` }}
              >
                <Star
                  className={`w-${size} h-${size} fill-primary text-primary`}
                />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <Star
              key={`empty-${i}`}
              className={`w-${size} h-${size} text-primary`}
            />
          ))}
        </>
      )}
    </div>
  )
}
