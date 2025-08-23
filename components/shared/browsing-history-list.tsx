'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import React, { useEffect } from 'react'
import ProductSlider from './product/product-slider'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '../ui/card'

export default function BrowsingHistoryList({}: { className?: string }) {
  const { products = [] } = useBrowsingHistory() // Ensure products is always an array
  const t = useTranslations('Home')

  return (
    products.length !== 0 && (
      <div className='mt-3 sm:mt-5 md:mt-10'>
        <Card className='w-full'>
          <CardContent className='p-3 sm:p-4 md:p-6'>
            <div className='space-y-6 md:space-y-10'>
              <ProductList
                title={t("Related to items that you've viewed")}
                type='related'
              />

              <div className='border-t border-border/50 dark:border-zinc-700 pt-4 mt-4'>
                <ProductList
                  title={t('Your browsing history')}
                  hideDetails
                  type='history'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  )
}

function ProductList({
  title,
  type = 'history',
  excludeId = '',
  hideDetails = false,
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  hideDetails?: boolean
}) {
  const { products = [] } = useBrowsingHistory() // Ensure products is always an array
  const [data, setData] = React.useState([])
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(
        `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${products
          .map((product) => product.category)
          .join(',')}&ids=${products.map((product) => product.id).join(',')}`
      )
      const data = await res.json()
      setData(data)
    }
    fetchProducts()
  }, [excludeId, products, type])

  return (
    data.length > 0 && (
      <ProductSlider title={title} products={data} hideDetails={hideDetails} />
    )
  )
}
