import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import connectToDatabase from '@/lib/db'

// Simple rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}

function validatePassword(password: string): boolean {
  // Strong password validation
  if (password.length < 8) return false
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return false
  if (/(.)\1{2,}/.test(password)) return false // No repeated characters
  return true
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting
  const clientIp =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
  const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp

  if (!checkRateLimit(ip)) {
    return res
      .status(429)
      .json({ error: 'Too many attempts. Please try again later.' })
  }
  const { token, newPassword, password } = req.body

  // Accept both 'newPassword' and 'password' for backwards compatibility
  const passwordToUse = newPassword || password

  // Input validation
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return res.status(400).json({ error: 'Invalid token format' })
  }

  if (!passwordToUse || typeof passwordToUse !== 'string') {
    return res.status(400).json({ error: 'Password is required' })
  }

  // Validate password strength
  if (!validatePassword(passwordToUse)) {
    return res.status(400).json({
      error:
        'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
    })
  }
  try {
    const { db } = await connectToDatabase()

    // Add artificial delay to prevent timing attacks
    const delay = new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 100)
    )

    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }, // Check if token is not expired
    })

    await delay // Ensure consistent response time

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    // Use higher cost factor for better security
    const hashedPassword = await bcrypt.hash(passwordToUse, 12)

    await db.collection('users').updateOne(
      { resetToken: token },
      {
        $set: {
          password: hashedPassword,
          // Update password change timestamp for security logging
          passwordChangedAt: new Date(),
        },
        $unset: { resetToken: '', resetTokenExpires: '' },
      }
    )

    res.status(200).json({ message: 'Password reset successfully' })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}
