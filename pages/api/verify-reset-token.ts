import { NextApiRequest, NextApiResponse } from 'next'
import connectToDatabase from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'Token is required' })
  }

  try {
    const { db } = await connectToDatabase()
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }, // Check if token is not expired
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    res.status(200).json({ message: 'Token is valid' })
  } catch {
    
    res.status(500).json({ error: 'Internal server error' })
  }
}
