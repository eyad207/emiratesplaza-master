import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllCategories } from '@/lib/actions/product.actions'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }
  try {
    const categories = await getAllCategories()
    res.status(200).json({ success: true, categories })
  } catch {
    
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch categories' })
  }
}
