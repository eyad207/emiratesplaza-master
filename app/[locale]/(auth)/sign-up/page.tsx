import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Card, CardContent } from '@/components/ui/card'

import SignUpForm from './signup-form'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Sign Up',
}

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams

  const { callbackUrl } = searchParams

  const session = await auth()
  if (session) {
    return redirect(callbackUrl || '/')
  }

  const t = await getTranslations('SignUp')

  return (
    <div className='w-full max-w-md mx-auto space-y-8'>
      {/* Welcome Section */}
      <div className='text-center space-y-4'>
        <div className='w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mx-auto flex items-center justify-center shadow-xl'>
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
              d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
            />
          </svg>
        </div>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            {t('CreateAccount')}
          </h1>
          <p className='text-muted-foreground mt-2'>
            Join us today and start your journey
          </p>
        </div>
      </div>

      {/* Sign Up Form Card */}
      <div className='space-y-6'>
        <Card className='border-0 shadow-none bg-transparent'>
          <CardContent className='p-0'>
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
