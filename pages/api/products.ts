import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import {
  processMultilingualSearch,
  createMultilingualSearchFilter,
  detectQueryLanguage,
} from '@/lib/multilingual-search'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase()

  if (req.method === 'GET') {
    const { query = '', page = '1', limit = '15', tag } = req.query
    const pageNumber = parseInt(page as string, 10) || 1
    const pageSize = parseInt(limit as string, 10) || 15

    let queryFilter: Record<string, unknown> = {}

    if (tag) {
      queryFilter = { tags: { $in: [tag] } }
    } else if (query && query !== '') {
      try {
        // Detect the language of the query
        const detectedLanguage = await detectQueryLanguage(query as string)
        // Process the search terms for multilingual search
        const searchTerms = await processMultilingualSearch({
          query: query as string,
          category: '', // No specific category filter for general search
          targetLanguage: detectedLanguage as 'ar' | 'en-US' | 'nb-NO',
          sourceLanguage: detectedLanguage,
        })

        // Create the MongoDB filter for multilingual search
        const multilingualFilter =
          await createMultilingualSearchFilter(searchTerms)

        queryFilter = multilingualFilter
      } catch {
        // Fallback to simple search if multilingual search fails
        const searchTerm = (query as string).trim()

        queryFilter = {
          name: { $regex: searchTerm, $options: 'i' },
        }
      }
    } else {
    }

    try {
      const products = await Product.find(queryFilter)
        .select('name description category tags _id')
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean()

      const totalProducts = await Product.countDocuments(queryFilter)

      return res.status(200).json({
        success: true,
        products,
        totalProducts,
      })
    } catch {
      return res.status(500).json({
        success: false,
        message: 'Error fetching products',
      })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
