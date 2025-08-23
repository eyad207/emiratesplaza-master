'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { checkEmailRegistered } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

const EmailButton = ({ email }: { email: string }) => {
  const [currentEmail, setCurrentEmail] = useState(email)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false) // Add a loading state for the submit button
  const router = useRouter()

  useEffect(() => {
    setCurrentEmail(email)
  }, [email])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])
  const generateCode = () => {
    // Use crypto.getRandomValues for cryptographically secure random numbers
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    // Generate 6-digit code with better randomness
    const code = (100000 + (array[0] % 900000)).toString()
    setGeneratedCode(code)
    setTimeout(() => setGeneratedCode(''), 15 * 60 * 1000) // Code expires in 15 minutes
    return code
  }

  const getUserFirstName = async (email: string): Promise<string> => {
    try {
      const response = await fetch('/api/getUserFirstName', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user first name')
      }

      const data = await response.json()
      return data.firstName
    } catch {
      return 'User'
    }
  }

  const sendVerificationCode = async (
    email: string,
    code: string,
    firstName: string
  ) => {
    try {
      const response = await fetch('/api/sendVerificationCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, firstName }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again later.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async () => {
    if (!currentEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Sending Code',
      description: 'The verification code is being sent to your email.',
      variant: 'default',
    })

    const isRegistered = await checkEmailRegistered(currentEmail)
    if (!isRegistered) {
      toast({
        title: 'Error',
        description: 'Email is not registered',
        variant: 'destructive',
      })
      return
    }

    const code = generateCode()
    const firstName = await getUserFirstName(currentEmail) // Get the user's first name
    await sendVerificationCode(currentEmail, code, firstName)

    setCodeSent(true)
    toast({
      title: 'Success',
      description: 'Email sent successfully',
      variant: 'default',
    })
    setCountdown(60)
  }

  const handleCodeSubmit = async () => {
    setIsSubmitting(true) // Set loading state to true immediately
    try {
      if (code === generatedCode) {
        const response = await fetch('/api/create-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: currentEmail }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create reset token')
        }

        const { token } = await response.json()
        router.push(`/reset-password?token=${token}`)
      } else {
        toast({
          title: 'Error',
          description: 'The code you entered is incorrect',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false) // Reset loading state after submission
    }
  }

  return (
    <div>
      <div className='flex items-center'>
        <Button
          onClick={handleSubmit}
          disabled={countdown > 0}
          className={countdown > 0 ? 'opacity-50' : ''}
        >
          Send Code
        </Button>
        {countdown > 0 && (
          <span className='ml-2 text-sm text-gray-600'>
            Resend in {countdown} seconds
          </span>
        )}
      </div>
      {codeSent && (
        <div className='mt-4'>
          <label
            htmlFor='code'
            className='block text-sm font-medium text-gray-700'
          >
            Code
          </label>
          <Input
            id='code'
            name='code'
            type='text'
            placeholder='Enter code'
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            onClick={handleCodeSubmit}
            className='mt-2'
            disabled={isSubmitting} // Disable the button while submitting
          >
            {isSubmitting ? 'Submitting...' : 'Submit Code'}{' '}
            {/* Show loading text */}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmailButton
