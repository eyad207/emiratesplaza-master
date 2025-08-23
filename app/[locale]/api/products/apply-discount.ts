import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { productIds, discount } = req.body

  if (!productIds || !discount || discount <= 0) {
    return res.status(400).json({ message: 'Invalid input' })
  }

  await connectToDatabase()

  try {
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { discount } }
    )
    res.status(200).json({ message: 'Discount applied successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to apply discount' })
  }
}
