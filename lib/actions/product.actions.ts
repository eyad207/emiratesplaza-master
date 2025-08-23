'use server'

import { connectToDatabase } from '@/lib/db'
import Product, { IProduct } from '@/lib/db/models/product.model'
import Tag from '@/lib/db/models/tag.model'
import { revalidatePath } from 'next/cache'
import {} from '../utils'
import { toSlug } from '../utils' // Add this import for toSlug
import { ProductInputSchema, ProductUpdateSchema } from '../validator'
import { IProductInput } from '@/types'
import mongoose from 'mongoose'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import {
  processMultilingualSearch,
  createMultilingualSearchFilter,
} from '../multilingual-search'

// CREATE
export async function createProduct(data: IProductInput) {
  try {
    const product = ProductInputSchema.parse(data)
    await connectToDatabase()
    product.tags = await resolveTagIds(product.tags)
    await Product.create(product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product created successfully',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

// UPDATE
export async function updateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    const product = ProductUpdateSchema.parse(data)
    await connectToDatabase()
    product.tags = await resolveTagIds(product.tags)
    await Product.findByIdAndUpdate(product._id, product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product updated successfully',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

// DELETE
export async function deleteProduct(id: string) {
  try {
    await connectToDatabase()
    const res = await Product.findByIdAndDelete(id)
    if (!res) throw new Error('Product not found')
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

// GET ONE PRODUCT BY ID
export async function getProductById(productId: string) {
  await connectToDatabase()
  const product = await Product.findById(productId)
  return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET ALL PRODUCTS FOR ADMIN
export async function getAllProductsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  limit,
  category, // Add category to the parameter list
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
  category?: string // Add category to the type definition
}) {
  await connectToDatabase()

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}
  const categoryFilter = category ? { category } : {} // Add category filter

  const order: Record<string, 1 | -1> = sort
    ? {
        [sort.split('-')[0]]: sort.split('-')[1] === 'asc' ? 1 : -1,
      }
    : { _id: -1 }
  const products = await Product.find({
    ...queryFilter,
    ...categoryFilter, // Apply category filter
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...categoryFilter, // Apply category filter
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
  }
}

export async function getAllCategories() {
  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )
  return categories
}

// New function to get categories with representative images
export async function getCategoriesWithImages(limit = 4) {
  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )

  const categoriesWithImages = await Promise.all(
    categories.slice(0, limit).map(async (category) => {
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
}

export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
}

// GET PRODUCTS BY TAG
export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET ONE PRODUCT BY SLUG
export async function getProductBySlug(slug: string) {
  await connectToDatabase()
  const product = await Product.findOne({ slug, isPublished: true }).select(
    'name price discountedPrice discount category images brand avgRating numReviews slug colors tags description reviews ratingDistribution numSales'
  )

  if (!product) throw new Error('Product not found')

  return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET RELATED PRODUCTS: PRODUCTS WITH SAME CATEGORY
export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }
  const products = await Product.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const productsCount = await Product.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(productsCount / limit),
  }
}
// GET ALL PRODUCTS WITH MULTILINGUAL SEARCH
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
  locale = 'en-US',
}: {
  query: string
  category: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
  locale?: 'ar' | 'en-US' | 'nb-NO'
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  // Process multilingual search terms
  const searchTerms = await processMultilingualSearch({
    query,
    category,
    targetLanguage: locale,
  })
  // Create multilingual search filter
  const multilingualFilter = await createMultilingualSearchFilter(searchTerms)

  // Traditional filters (non-multilingual)
  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {}

  // Price filter (10-50)
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }

  const isPublished = { isPublished: true }

  // Combine all filters
  const finalFilter = {
    ...isPublished,
    ...multilingualFilter,
    ...tagFilter,
    ...priceFilter,
    ...ratingFilter,
  }

  const products = await Product.find(finalFilter)
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .select(
      'name price discountedPrice discount category images brand avgRating numReviews slug colors tags description'
    )
    .lean()

  const countProducts = await Product.countDocuments(finalFilter)

  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
    searchTerms, // Include processed search terms for debugging
  }
}

export async function getAllTags() {
  const tags = await Product.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])
  return (
    (tags[0]?.uniqueTags
      .filter((tag: unknown) => typeof tag === 'string') // Ensure only strings are processed
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}

export async function addItem(
  productId: string,
  color: string,
  size: string,
  quantity: number
) {
  try {
    await connectToDatabase()
    const product = await Product.findById(productId)

    if (!product) {
      throw new Error('Product not found')
    }

    const selectedColor = product.colors.find((c) => c.color === color)
    if (!selectedColor) {
      throw new Error('Selected color not available')
    }

    const selectedSize = selectedColor.sizes.find((s) => s.size === size)
    if (!selectedSize) {
      throw new Error('Selected size not available')
    }

    if (selectedSize.countInStock < quantity) {
      throw new Error('Not enough items in stock')
    }

    // Ensure countInStock does not go below 0
    selectedSize.countInStock = Math.max(
      0,
      selectedSize.countInStock - quantity
    )
    await product.save()

    return {
      success: true,
      message: 'Item added successfully',
    }
  } catch {
    return {
      success: false,
      message: 'An unknown error occurred',
    }
  }
}

export async function applyDiscountToProducts({
  productIds,
  discount,
  category,
  tagId,
}: {
  productIds?: string[]
  discount: number
  category?: string
  tagId?: string
}) {
  try {
    await connectToDatabase()
    let products = []
    if (productIds && productIds.length > 0) {
      products = await Product.find({ _id: { $in: productIds } })
    } else if (category) {
      products = await Product.find({ category })
    } else if (tagId) {
      products = await Product.find({ tags: tagId })
    } else {
      throw new Error('No products, category, or tag specified')
    }

    for (const product of products) {
      const newPrice = product.price - (product.price * discount) / 100
      product.discountedPrice = Math.max(newPrice, 0)
      product.discount = discount
      await product.save()
    }

    return {
      success: true,
      message: 'Discount applied successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}

export async function removeDiscountFromProducts({
  productIds,
}: {
  productIds: string[]
}) {
  try {
    await connectToDatabase()
    const products = await Product.find({ _id: { $in: productIds } })

    for (const product of products) {
      product.discountedPrice = null // Reset discounted price
      product.discount = null // Remove discount
      await product.save()
    }

    return {
      success: true,
      message: 'Discount removed successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}

export async function updateStockForProducts({
  productIds,
  quantity,
}: {
  productIds: string[]
  quantity: number
}) {
  try {
    await connectToDatabase()

    const products = await Product.find({ _id: { $in: productIds } })

    if (!products.length) {
      throw new Error('No products found for the given IDs')
    }

    for (const product of products) {
      product.colors.forEach((color) => {
        color.sizes.forEach((size) => {
          size.countInStock = Math.max(0, size.countInStock + quantity) // Ensure stock does not go below 0
        })
      })
      await product.save() // Save changes for each product
    }

    return {
      success: true,
      message: 'Stock updated successfully for selected products',
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}

async function resolveTagIds(tagNamesOrIds: string[]): Promise<string[]> {
  if (!Array.isArray(tagNamesOrIds)) return [] // Ensure the input is an array
  const tags = await Tag.find({
    $or: [{ name: { $in: tagNamesOrIds } }, { _id: { $in: tagNamesOrIds } }],
  }).lean()
  return tags.map((tag) =>
    new mongoose.Types.ObjectId(tag._id as mongoose.Types.ObjectId).toString()
  ) // Convert _id to string
}

// GET ALL CATEGORIES WITH MULTILINGUAL SUPPORT
export async function getAllCategoriesWithTranslation(
  locale: 'ar' | 'en-US' | 'nb-NO' = 'en-US'
) {
  try {
    await connectToDatabase()

    // Ensure connection is ready before querying
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready')
    }

    const categories = await Product.find({ isPublished: true }).distinct(
      'category'
    )

    // Import here to avoid circular dependency
    const { translateCategoriesForDisplay } = await import(
      '../multilingual-search'
    )

    try {
      const translatedCategories = await translateCategoriesForDisplay(
        categories,
        locale
      )
      return translatedCategories
    } catch {
      // Fallback to original categories if translation fails
      return categories.map((category) => ({
        original: category,
        translated: category,
      }))
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getAllTagsWithTranslation(
  locale: 'ar' | 'en-US' | 'nb-NO' = 'en-US'
) {
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
}
