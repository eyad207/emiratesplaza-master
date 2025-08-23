import { NextApiRequest, NextApiResponse } from 'next'
import { getProductById } from '@/lib/actions/product.actions'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query
  const product = await getProductById(id as string)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.status(200).json(product)
}
