'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ErrorPage({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const t = useTranslations()

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-md w-full animate-fadeInScale'>
        {/* Animated Error Icon */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full mb-4 hover-scale'>
            <AlertTriangle className='w-10 h-10 text-destructive animate-pulse' />
          </div>
          <div className='text-6xl font-bold text-muted select-none'>ERROR</div>
        </div>

        {/* Content Card */}
        <div className='card-professional bg-card border border-border p-8 hover-lift'>
          <div className='relative z-10'>
            {/* Text Content */}
            <div className='text-center mb-8'>
              <h1 className='h1-bold text-foreground mb-4'>
                {t('Error.Error')}
              </h1>
              <p className='text-muted-foreground text-sm'>
                Could not find the page you were looking for. Please try again
                or return to the homepage.
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                onClick={reset}
                className='enhanced-button flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 hover-arrow-animation'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                {t('Error.Try again')}
              </Button>
              <Button
                variant='outline'
                onClick={handleGoHome}
                className='enhanced-button flex-1 border-border text-foreground hover:bg-muted py-2.5 hover-arrow-animation'
              >
                <Home className='w-4 h-4 mr-2' />
                {t('Error.Back To Home')}
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Help */}
        <div className='text-center mt-6'>
          <p className='text-sm text-muted-foreground'>
            If this problem persists, please{' '}
            <button
              onClick={handleGoHome}
              className='card-link hover-color font-medium transition-colors duration-300'
            >
              contact support
            </button>
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div
        className='absolute top-1/4 left-1/4 w-2 h-2 bg-destructive/60 rounded-full animate-bounce opacity-60'
        style={{ animationDelay: '0s' }}
      ></div>
      <div
        className='absolute top-1/3 right-1/4 w-1 h-1 bg-destructive/40 rounded-full animate-bounce opacity-40'
        style={{ animationDelay: '1.5s' }}
      ></div>
      <div
        className='absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-destructive/50 rounded-full animate-bounce opacity-50'
        style={{ animationDelay: '3s' }}
      ></div>
    </div>
  )
}
