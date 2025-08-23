import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className='space-y-6 animate-pulse'>
      {/* Carousel skeleton */}
      <div className='relative w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden'>
        <Skeleton className='w-full h-full' />
      </div>

      {/* Cards skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className='shadow-sm'>
            <CardContent className='p-4'>
              <Skeleton className='h-6 w-3/4 mb-4' />
              <div className='grid grid-cols-2 gap-2'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className='space-y-2'>
                    <Skeleton className='h-20 w-full rounded' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product sliders skeleton */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-6 w-20' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className='shadow-sm'>
                <CardContent className='p-4'>
                  <Skeleton className='h-32 w-full rounded mb-3' />
                  <Skeleton className='h-4 w-full mb-2' />
                  <Skeleton className='h-4 w-3/4 mb-2' />
                  <Skeleton className='h-6 w-1/2' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Browsing history skeleton */}
      <Card>
        <CardContent className='p-6'>
          <Skeleton className='h-6 w-40 mb-4' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-24 w-full rounded' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
