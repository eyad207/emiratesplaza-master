// Example of how to add caching to your existing product actions
// Add this to your lib/actions/product.actions.ts file

import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db/connection-pool'
import { withCache } from '@/lib/cache'
import Tag from '@/lib/db/models/tag.model'
import Product from '@/lib/db/models/product.model'
import { toSlug } from '@/lib/utils'

// Cached version of getAllTagsWithTranslation
export async function getAllTagsWithTranslationCached(
  locale: 'ar' | 'en-US' | 'nb-NO' = 'en-US'
) {
  const cacheKey = `tags-${locale}`
  
  return withCache(
    cacheKey,
    async () => {
      // Your existing implementation here
      try {
        await connectToDatabase()

        // Ensure connection is ready before querying
        if (mongoose.connection.readyState !== 1) {
          throw new Error('Database connection not ready')
        }

        const tags = await Tag.find().sort({ name: 1 }).lean()

        // Import here to avoid circular dependency
        const { translateTagsForDisplay } = await import('../multilingual-search')

        try {
          const translatedTags = await translateTagsForDisplay(
            tags.map((tag) => ({ _id: tag._id.toString(), name: tag.name })),
            locale
          )
          return translatedTags
        } catch {
          return tags.map((tag) => ({
            _id: tag._id.toString(),
            original: tag.name,
            translated: tag.name,
          }))
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
        return []
      }
    },
    10 * 60 * 1000 // Cache for 10 minutes
  )
}

// Cached version of getAllCategories
export async function getAllCategoriesCached() {
  return withCache(
    'categories-all',
    async () => {
      await connectToDatabase()
      const categories = await Product.find({ isPublished: true }).distinct('category')
      return categories
    },
    15 * 60 * 1000 // Cache for 15 minutes
  )
}

// Cached version of getCategoriesWithImages
export async function getCategoriesWithImagesCached(limit = 4) {
  const cacheKey = `categories-with-images-${limit}`
  
  return withCache(
    cacheKey,
    async () => {
      await connectToDatabase()
      const categories = await Product.find({ isPublished: true }).distinct('category')

      const categoriesWithImages = await Promise.all(
        categories.slice(0, limit).map(async (category: string) => {
          // Find one product from this category that has images
          const product = await Product.findOne(
            {
              category,
              isPublished: true,
              images: { $exists: true, $not: { $size: 0 } },
            },
            { images: 1 }
          ).sort({ createdAt: -1 })

          return {
            name: category,
            // Use the first image if available, otherwise fall back to a default
            image:
              product && product.images && product.images.length > 0
                ? product.images[0]
                : `/images/${toSlug(category)}.jpg`,
          }
        })
      )

      return categoriesWithImages
    },
    20 * 60 * 1000 // Cache for 20 minutes
  )
}
