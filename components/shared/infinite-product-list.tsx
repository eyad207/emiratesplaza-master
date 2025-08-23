'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { getAllProducts } from '@/lib/actions/product.actions'
import ProductCard from '@/components/shared/product/product-card'
import { IProduct } from '@/lib/db/models/product.model'

const LoadingSpinner: React.FC = () => (
  <div role='status' className='col-span-full flex justify-center py-8'>
    <svg
      aria-hidden='true'
      className='inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600'
      viewBox='0 0 100 101'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591
          C22.3858 100.591 0 78.2051 0 50.5908
          C0 22.9766 22.3858 0.59082 50 0.59082
          C77.6142 0.59082 100 22.9766 100 50.5908Z'
        fill='currentColor'
      />
      <path
        d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116
          97.0079 33.5539C95.2932 28.8227 92.871 24.3692
          89.8167 20.348C85.8452 15.1192 80.8826 10.7238
          75.2124 7.41289C69.5422 4.10194 63.2754 1.94025
          56.7698 1.05124C51.7666 0.367541 46.6976 0.446843
          41.7345 1.27873C39.2613 1.69328 37.813 4.19778
          38.4501 6.62326C39.0873 9.04874 41.5694 10.4717
          44.0505 10.1071C47.8511 9.54855 51.7191 9.52689
          55.5402 10.0491C60.8642 10.7766 65.9928 12.5457
          70.6331 15.2552C75.2735 17.9648 79.3347 21.5619
          82.5849 25.841C84.9175 28.9121 86.7997 32.2913
          88.1811 35.8758C89.083 38.2158 91.5421 39.6781
          93.9676 39.0409Z'
        fill='currentFill'
      />
    </svg>
    <span className='sr-only'>Loading...</span>
  </div>
)

const InfiniteProductList: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1)
          }
        },
        {
          rootMargin: '200px',
          threshold: 0.1,
        }
      )

      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  useEffect(() => {
    let isCancelled = false

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await getAllProducts({
          query: '',
          category: '',
          tag: '',
          page,
        })
        if (isCancelled) return

        const newProducts = response.products
        setProducts((prev) => {
          const ids = new Set(prev.map((p) => p._id))
          const uniqueNew = newProducts.filter((p) => !ids.has(p._id))
          return [...prev, ...uniqueNew]
        })

        if (newProducts.length === 0) setHasMore(false)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchProducts()

    return () => {
      isCancelled = true
    }
  }, [page])

  if (products.length === 0 && !loading) {
    return (
      <div className='text-center py-16 text-gray-600 dark:text-gray-400'>
        No products found.
      </div>
    )
  }

  return (
    <>
      <div
        className='grid gap-3 sm:gap-4 lg:gap-6 
                    grid-cols-2 
                    sm:grid-cols-4 
                    md:grid-cols-4 
                    lg:grid-cols-4 
                    xl:grid-cols-4
                    2xl:grid-cols-4'
      >
        {products.map((product, idx) => (
          <div
            key={product._id}
            ref={idx === products.length - 1 ? loadMoreRef : null}
            className='transition-all duration-300 hover:shadow-lg' // Removed hover:scale-105 to prevent overlap
          >
            <ProductCard
              product={product}
              hideAddToCartButton={false}
              hideBrandOnMobile={false}
              isInInfiniteList
              className='h-full w-full max-w-sm mx-auto' // Responsive sizing
            />
          </div>
        ))}
      </div>
      {loading && <LoadingSpinner />}
    </>
  )
}

export default InfiniteProductList
