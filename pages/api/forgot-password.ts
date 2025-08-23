import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { sendEmail } from '@/lib/email'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email } = req.body

  try {
    await connectToDatabase()
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the token and expiration in the database
    user.resetPasswordToken = token
    user.resetPasswordExpires = expires
    await user.save()

    // Generate the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    // Send the reset link via email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.`,
    })

    res.status(200).json({ message: 'Password reset email sent' })
  } catch {
    
    res.status(500).json({ message: 'Internal server error' })
  }
}
