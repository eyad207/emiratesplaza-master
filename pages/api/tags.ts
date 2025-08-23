import { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '@/lib/db'
import Tag from '@/lib/db/models/tag.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase()

  if (req.method === 'GET') {
    const tags = await Tag.find().sort({ name: 1 })
    return res.status(200).json({
      success: true,
      tags: tags.map((tag) => ({ name: tag.name, _id: tag._id })),
    })
  }

  if (req.method === 'POST') {
    const { name } = req.body

    // Check if the tag name is empty or not a string
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tag name must be a non-empty string',
      })
    }

    try {
      // Check if a tag with the same name already exists
      const existingTag = await Tag.findOne({ name: name.trim() })
      if (existingTag) {
        return res
          .status(400)
          .json({ success: false, message: 'Tag name already exists' })
      }

      // Create the new tag
      const tag = await Tag.create({ name: name.trim() })
      return res.status(201).json({
        success: true,
        message: 'Tag added successfully',
        _id: tag._id,
      })
    } catch {
      return res
        .status(500)
        .json({ success: false, message: 'Error adding tag' })
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query // Use `id` instead of `name`
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: 'Tag ID is required' })
    try {
      const deletedTag = await Tag.findByIdAndDelete(id) // Delete by `_id`
      if (!deletedTag) {
        return res
          .status(404)
          .json({ success: false, message: 'Tag not found' })
      }
      return res
        .status(200)
        .json({ success: true, message: 'Tag deleted successfully' })
    } catch {
      return res
        .status(500)
        .json({ success: false, message: 'Error deleting tag' })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
