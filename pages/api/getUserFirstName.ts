import { NextApiRequest, NextApiResponse } from 'next'
import User from '@/lib/db/models/user.model'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { email } = req.body

    try {
      const user = await User.findOne({ email }).select('name').lean()
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.status(200).json({ firstName: user.name })
    } catch {
      
      res.status(500).json({ error: 'Failed to fetch user first name' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
