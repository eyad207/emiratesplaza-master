'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-md w-full animate-fadeInScale'>
        {/* Animated 404 Number */}
        <div className='text-center mb-8'>
          <div className='inline-block relative'>
            <h1 className='text-8xl md:text-9xl font-bold text-muted select-none'>
              404
            </h1>
            <div className='absolute inset-0 text-8xl md:text-9xl font-bold text-primary animate-pulse opacity-80'>
              404
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className='card-professional bg-card border border-border p-8 hover-lift'>
          <div className='relative z-10'>
            {/* Icon */}
            <div className='flex justify-center mb-6'>
              <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center hover-scale'>
                <Search className='w-8 h-8 text-muted-foreground' />
              </div>
            </div>

            {/* Text Content */}
            <div className='text-center mb-8'>
              <h2 className='h1-bold text-foreground mb-3'>Page Not Found</h2>
              <p className='text-muted-foreground leading-relaxed'>
                Sorry, we couldnt find the page youre looking for. The page may
                have been moved, deleted, or the URL might be incorrect.
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                onClick={handleGoHome}
                className='enhanced-button flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 hover-arrow-animation'
              >
                <Home className='w-4 h-4 mr-2' />
                Go Home
              </Button>
              <Button
                variant='outline'
                onClick={handleGoBack}
                className='enhanced-button flex-1 border-border text-foreground hover:bg-muted py-2.5 hover-arrow-animation'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Go Back
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className='text-center mt-6'>
          <p className='text-sm text-muted-foreground'>
            Need help? Try searching from our{' '}
            <button
              onClick={handleGoHome}
              className='card-link hover-color font-medium transition-colors duration-300'
            >
              homepage
            </button>
          </p>
        </div>
      </div>

      {/* Floating Elements using your primary color */}
      <div
        className='absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-bounce opacity-60'
        style={{ animationDelay: '0s' }}
      ></div>
      <div
        className='absolute top-1/3 right-1/4 w-1 h-1 bg-primary rounded-full animate-bounce opacity-40'
        style={{ animationDelay: '1s' }}
      ></div>
      <div
        className='absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-primary rounded-full animate-bounce opacity-50'
        style={{ animationDelay: '2s' }}
      ></div>
    </div>
  )
}
