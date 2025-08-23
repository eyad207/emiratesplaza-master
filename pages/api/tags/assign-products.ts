import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Tag from '@/lib/db/models/tag.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase()

  if (req.method === 'POST') {
    const { tagId, productIds } = req.body

    // Validate input
    if (!tagId || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag ID and product IDs are required',
      })
    }

    try {
      // Check if the tag exists
      const tag = await Tag.findById(tagId)
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: 'Tag not found',
        })
      }

      // Update products to include the tag ID
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $addToSet: { tags: tag._id } } // Add the tag ID to the product's tags array
      )

      if (result.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No products were updated. Please check the product IDs.',
        })
      }

      return res.status(200).json({
        success: true,
        message: `${result.modifiedCount} products assigned to tag successfully`,
      })
    } catch {
      
      return res.status(500).json({
        success: false,
        message: 'Error assigning products to tag',
      })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
