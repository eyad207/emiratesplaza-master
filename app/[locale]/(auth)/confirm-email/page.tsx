'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  verifyCodeAndRegisterUser,
  sendVerificationCode,
} from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const name = searchParams?.get('name') || ''
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  const handleSubmit = async () => {
    try {
      const res = await verifyCodeAndRegisterUser(email, name)
      if (!res.success) {
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive',
        })
        return
      }
      router.push(callbackUrl)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to verify code',
        variant: 'destructive',
      })
    }
  }

  const handleResendCode = async () => {
    try {
      const res = await sendVerificationCode(email, name)
      if (!res.success) {
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive',
        })
        return
      }
      setCountdown(60) // Set countdown to 60 seconds
      toast({
        title: 'Success',
        description: 'Verification code resent successfully',
        variant: 'default',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to resend verification code',
        variant: 'destructive',
      })
    }
  }

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div className='w-full max-w-md mx-auto space-y-8'>
      {/* Icon Section */}
      <div className='text-center space-y-4'>
        <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-xl'>
          <svg
            className='w-10 h-10 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
        </div>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Confirm Your Email
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-2'>
            We&apos;ve sent a verification code to your email
          </p>
        </div>
      </div>

      {/* Email Info */}
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4'>
        <p className='text-sm text-blue-800 dark:text-blue-200 text-center'>
          A verification code has been sent to{' '}
          <span className='font-semibold text-blue-900 dark:text-blue-100'>
            {email}
          </span>
        </p>
      </div>

      {/* Form Section */}
      <div className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Verification Code
          </label>
          <Input
            type='text'
            placeholder='Enter verification code'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className='h-12 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg font-mono tracking-wider'
          />
        </div>

        <Button
          onClick={handleSubmit}
          className='w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]'
        >
          Verify Code
        </Button>

        <div className='text-center'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Didn&apos;t receive the code?{' '}
            <button
              className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors duration-200'
              onClick={handleResendCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
