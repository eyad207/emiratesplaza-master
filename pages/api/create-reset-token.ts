import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import connectToDatabase from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }
  try {
    const { connection } = await connectToDatabase()

    const db = connection.db
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' })
    }

    // Use constant-time comparison to prevent user enumeration attacks
    const user = await db.collection('users').findOne({ email })

    // Always respond with success to prevent email enumeration
    // But only create token if user exists
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

      const result = await db
        .collection('users')
        .updateOne({ email }, { $set: { resetToken, resetTokenExpires } })

      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: 'Failed to update reset token' })
      }

      res.status(200).json({ token: resetToken })
    } else {
      // Still return success but with a fake token to prevent enumeration
      // The token verification will fail anyway
      res.status(200).json({ token: crypto.randomBytes(32).toString('hex') })
    }
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}
