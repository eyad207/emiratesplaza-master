'use server'

import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Filter } from 'bad-words'

import { auth } from '@/auth'

import { connectToDatabase } from '../db'
import Product from '../db/models/product.model'
import Review, { IReview } from '../db/models/review.model'
import {} from '../utils'
import { ReviewInputSchema } from '../validator'
import { IReviewDetails } from '@/types'
import { getSetting } from './setting.actions'

const filter = new Filter()

export async function createUpdateReview({
  data,
  path,
}: {
  data: z.infer<typeof ReviewInputSchema>
  path: string
}) {
  try {
    const session = await auth()
    if (!session) {
      throw new Error('User is not authenticated')
    }

    const review = ReviewInputSchema.parse({
      ...data,
      user: session?.user?.id,
    })

    // Check for profanity
    if (filter.isProfane(review.title) || filter.isProfane(review.comment)) {
      throw new Error('Your review contains inappropriate language')
    }

    await connectToDatabase()
    const existReview = await Review.findOne({
      product: review.product,
      user: review.user,
    })

    if (existReview) {
      existReview.comment = review.comment
      existReview.rating = review.rating
      existReview.title = review.title
      await existReview.save()
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
        success: true,
        message: 'Review updated successfully',
        // data: JSON.parse(JSON.stringify(existReview)),
      }
    } else {
      await Review.create(review)
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
        success: true,
        message: 'Review created successfully',
        // data: JSON.parse(JSON.stringify(newReview)),
      }
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}

const updateProductReview = async (productId: string) => {
  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ])

  // Calculate the total number of reviews and average rating
  const totalReviews = result.reduce((sum, { count }) => sum + count, 0)
  const avgRating =
    totalReviews > 0
      ? result.reduce((sum, { _id, count }) => sum + _id * count, 0) /
        totalReviews
      : 0 // Default to 0 if there are no reviews

  // Convert aggregation result to a map for easier lookup
  const ratingMap = result.reduce((map, { _id, count }) => {
    map[_id] = count
    return map
  }, {})

  // Ensure all ratings 1-5 are represented, with missing ones set to count: 0
  const ratingDistribution = []
  for (let i = 1; i <= 5; i++) {
    ratingDistribution.push({ rating: i, count: ratingMap[i] || 0 })
  }

  // Update product fields with calculated values
  await Product.findByIdAndUpdate(productId, {
    avgRating: avgRating.toFixed(1), // Ensure avgRating is a valid number
    numReviews: totalReviews,
    ratingDistribution,
  })
}

export async function getReviews({
  productId,
  limit,
  page,
}: {
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (page - 1) * limit
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name')
    .sort({
      createdAt: 'desc',
    })
    .skip(skipAmount)
    .limit(limit)
  const reviewsCount = await Review.countDocuments({ product: productId })
  return {
    data: JSON.parse(JSON.stringify(reviews)) as IReviewDetails[],
    totalPages: reviewsCount === 0 ? 1 : Math.ceil(reviewsCount / limit),
  }
}
export const getReviewByProductId = async ({
  productId,
}: {
  productId: string
}) => {
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const review = await Review.findOne({
    product: productId,
    user: session?.user?.id,
  })
  return review ? (JSON.parse(JSON.stringify(review)) as IReview) : null
}

export async function deleteReview(reviewId: string, productId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) {
      throw new Error('User is not authenticated')
    }

    // Get the review
    const review = await Review.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    // Check if user is admin or review owner
    if (
      session.user.role !== 'Admin' &&
      review.user.toString() !== session.user.id
    ) {
      throw new Error('Not authorized')
    }

    await review.deleteOne()
    await updateProductReview(productId)
    revalidatePath(`/product/${productId}`)

    return {
      success: true,
      message: 'Review deleted successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}
export async function deleteAllReviews(productId: string) {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session || session.user.role !== 'Admin') {
      throw new Error('Not authorized')
    }

    await Review.deleteMany({ product: productId })
    await updateProductReview(productId)
    revalidatePath(`/product/${productId}`)

    return {
      success: true,
      message: 'All reviews deleted successfully',
    }
  } catch {
    return {
      success: false,
      message: 'Operation failed',
    }
  }
}
