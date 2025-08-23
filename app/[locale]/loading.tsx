'use client'
import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingPage() {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-sm w-full animate-fadeInScale'>
        {/* Loading Animation Container */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 hover-scale'>
            <Loader2 className='w-10 h-10 text-primary animate-spin' />
          </div>

          {/* Pulse Dots Animation */}
          <div className='flex justify-center space-x-1 mb-4'>
            <div
              className='w-2 h-2 bg-primary rounded-full animate-bounce'
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className='w-2 h-2 bg-primary rounded-full animate-bounce'
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className='w-2 h-2 bg-primary rounded-full animate-bounce'
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>

        {/* Content Card */}
        <div className='card-professional bg-card border border-border p-8 text-center'>
          <div className='relative z-10'>
            {/* Loading Text */}
            <div role='status' aria-live='polite'>
              <h2 className='h2-bold text-foreground mb-3'>Laster</h2>
            </div>

            {/* Progress Bar */}
            <div className='mt-6'>
              <div className='w-full bg-muted rounded-full h-1 overflow-hidden'>
                <div className='h-full bg-primary rounded-full animate-pulse w-3/5'></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className='absolute top-1/4 left-1/4 w-1 h-1 bg-primary/40 rounded-full animate-bounce opacity-60'></div>
      <div className='absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce opacity-40'></div>
      <div className='absolute bottom-1/3 left-1/3 w-1 h-1 bg-primary/50 rounded-full animate-bounce opacity-50'></div>
    </div>
  )
}
