import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import type { NextApiRequest, NextApiResponse } from 'next'

interface RemoveProductsRequestBody {
  tagId: string
  productIds: string[]
}

interface ApiResponse {
  success: boolean
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  const { tagId, productIds } = req.body as RemoveProductsRequestBody

  if (!tagId || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input' })
  }

  try {
    await connectToDatabase()

    // Remove the tag from the products
    await Product.updateMany(
      { _id: { $in: productIds }, tags: tagId },
      { $pull: { tags: tagId } }
    )

    res.status(200).json({
      success: true,
      message: 'Products removed from tag successfully',
    })
  } catch {
    
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
