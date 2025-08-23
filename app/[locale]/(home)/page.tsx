import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import { Card, CardContent } from '@/components/ui/card'
import React from 'react'
import {
  getProductsByTag,
  getCategoriesWithImages,
} from '@/lib/actions/product.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import Tag from '@/lib/db/models/tag.model'
import { connectToDatabase } from '@/lib/db'
import InfiniteProductList from '@/components/shared/infinite-product-list'

// Optimize cache configuration for better performance
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const revalidate = 300 // revalidate every 5 minutes instead of forcing dynamic

export default async function HomePage() {
  // Parallel data fetching for better performance
  const [t, { carousels }, tags] = await Promise.all([
    getTranslations('Home'),
    getSetting(),
    connectToDatabase().then(() =>
      Tag.find()
        .sort({ name: 1 })
        .limit(8) // Limit to reduce data load
        .lean()
        .exec()
    ),
  ])

  // Optimize: Only fetch products for the first few tags to reduce load time
  const limitedTags = tags.slice(0, 6) // Only process first 6 tags
  const tagsWithProducts = await Promise.all(
    limitedTags.map(async (tag) => {
      const products = await getProductsByTag({
        tag: tag._id.toString(),
        limit: 4,
      })
      return { ...tag, products }
    })
  )

  // Use the new function to get categories with their images
  const categoriesWithImages = await getCategoriesWithImages(4)

  const cards = [
    {
      title: t('Categories to explore'),
      link: {
        text: t('See More'),
        href: '/search',
      },
      items: categoriesWithImages.map((category) => ({
        name: category.name,
        image: category.image,
        href: `/search?category=${category.name}&q=all`,
        className: 'transition-transform duration-300 hover:scale-105',
      })),
    },
    ...tagsWithProducts.map((tag) => ({
      title: `${tag.name}`,
      items: tag.products.map((product) => ({
        name: product.name,
        image: product.images[0],
        href: `/product/${product.slug}`,
        className: 'transition-transform duration-300 hover:scale-105',
      })),
      link: {
        text: t('View All'),
        href: `/search?tag=${tag._id}`,
      },
      key: `tag-${tag._id}`, // Ensure unique key
    })),
  ]

  const tagSections = await Promise.all(
    tags.map(async (tag) => {
      const products = await getProductsByTag({ tag: tag._id.toString() })
      return {
        title: tag.name,
        products,
        link: {
          text: t('View All'),
          href: `/search?tag=${tag._id}`,
        },
      }
    })
  )

  return (
    <div className='pb-4 sm:pb-6'>
      <HomeCarousel items={carousels} />
      <div className='px-2 sm:px-3 md:p-4 space-y-3 md:space-y-4 bg-border'>
        <div className='pt-3 sm:pt-4'>
          <HomeCard cards={cards} />
        </div>
        {tagSections.map((section, index) => (
          <Card key={`section-${section.title}-${index}`} className='w-full'>
            <CardContent className='p-2 sm:p-3 md:p-4 items-center gap-3'>
              <ProductSlider
                title={section.title}
                products={section.products}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='px-2 sm:px-3 md:p-4 bg-border'>
        <BrowsingHistoryList />
      </div>
      <div className='px-2 sm:px-3 md:p-4 bg-border'>
        <h2 className='font-bold text-xl py-4'>{t('See More')}</h2>
        <InfiniteProductList />
      </div>
    </div>
  )
}
