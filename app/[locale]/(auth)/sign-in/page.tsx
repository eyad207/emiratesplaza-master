import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Card, CardContent } from '@/components/ui/card'

import CredentialsSignInForm from './credentials-signin-form'
import { GoogleSignInForm } from './google-signin-form'
import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default async function SignInPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl = '/' } = await searchParamsPromise

  const session = await auth()
  if (session) {
    redirect(callbackUrl)
  }

  const [t, { site }] = await Promise.all([
    getTranslations('SignIn'),
    getSetting(),
  ])

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
              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
            />
          </svg>
        </div>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>{t('SignIn')}</h1>
          <p className='text-muted-foreground mt-2'>
            Welcome back! Sign in to your account
          </p>
        </div>
      </div>

      {/* Sign In Form Card */}
      <div className='space-y-6'>
        <Card className='border-0 shadow-none bg-transparent'>
          <CardContent className='p-0 space-y-6'>
            <CredentialsSignInForm />

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-4 mb-2 bg-zinc-100 dark:bg-zinc-900 text-muted-foreground'>
                  or continue with
                </span>
              </div>
            </div>

            <GoogleSignInForm />
          </CardContent>
        </Card>

        {/* Divider */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t border-border' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 mb-2 bg-zinc-100 dark:bg-zinc-900 text-muted-foreground'>
              {t('NewToSite', { siteName: site.name })}
            </span>
          </div>
        </div>

        {/* Create Account Button */}
        <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <Button
            className='w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg '
            variant='default'
          >
            {t('CreateAccount', { siteName: site.name })}
          </Button>
        </Link>
      </div>
    </div>
  )
}
