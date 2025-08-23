import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { EmailTemplate } from '@/emails/email-form'
import React from 'react'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY)

// Simple rate limiting for email sending
const emailRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>()

function checkEmailRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxEmails = 2 // Max 2 emails per minute per IP/email

  const record = emailRateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    emailRateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxEmails) {
    return false
  }

  record.count++
  return true
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { email, code, firstName } = req.body

    // Input validation
    if (!email || !code || !firstName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Rate limiting
    const clientIp =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      'unknown'
    const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp
    const identifier = `${ip}:${email}`

    if (!checkEmailRateLimit(identifier)) {
      return res
        .status(429)
        .json({
          error:
            'Too many email requests. Please wait before requesting again.',
        })
    }

    try {
      await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Your Verification Code',
        react: React.createElement(EmailTemplate, { firstName, code }),
      })
      res.status(200).json({ message: 'Email sent successfully' })
    } catch {
      res.status(500).json({ error: 'Failed to send email' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
