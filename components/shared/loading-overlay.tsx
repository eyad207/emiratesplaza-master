'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  type?: 'currency' | 'language' | 'general'
}

export default function LoadingOverlay({
  isVisible,
  message,
  type = 'general',
}: LoadingOverlayProps) {
  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'currency':
        return (
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-2xl font-bold text-primary'>$</span>
            </div>
          </div>
        )
      case 'language':
        return (
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-2xl'>🌐</span>
            </div>
          </div>
        )
      default:
        return (
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin'></div>
          </div>
        )
    }
  }

  const getMessage = () => {
    if (message) return message

    switch (type) {
      case 'currency':
        return 'Updating currency...'
      case 'language':
        return 'Switching language...'
      default:
        return 'Loading...'
    }
  }

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center animate-slideIn'>
      {/* Backdrop with blur effect */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdropFadeIn' />

      {/* Loading content */}
      <div className='relative z-10 flex flex-col items-center justify-center p-8 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 max-w-sm mx-4 animate-fadeInScale'>
        {/* Animated icon */}
        <div className='mb-6 animate-pulseGlow'>{getIcon()}</div>

        {/* Loading message */}
        <div className='text-center space-y-2'>
          <h3 className='text-lg font-semibold text-foreground'>
            {getMessage()}
          </h3>
          <p className='text-sm text-muted-foreground'>
            Please wait a moment...
          </p>
        </div>

        {/* Progress dots */}
        <div className='flex space-x-1 mt-6'>
          <div
            className='w-2 h-2 bg-primary rounded-full animate-pulse'
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className='w-2 h-2 bg-primary rounded-full animate-pulse'
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className='w-2 h-2 bg-primary rounded-full animate-pulse'
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>

        {/* Shimmer effect on the card */}
        <div className='absolute inset-0 rounded-2xl opacity-30 animate-shimmer pointer-events-none' />
      </div>
    </div>
  )
}

// Additional loading spinner for inline use
interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InlineSpinner({ size = 'md', className }: InlineSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }

  return (
    <div
      className={cn(
        'border-primary/20 border-t-primary rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  )
}

// Loading dots animation
interface LoadingDotsProps {
  className?: string
  dotClassName?: string
}

export function LoadingDots({ className, dotClassName }: LoadingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div
        className={cn(
          'w-2 h-2 bg-current rounded-full animate-bounce',
          dotClassName
        )}
        style={{ animationDelay: '0ms' }}
      ></div>
      <div
        className={cn(
          'w-2 h-2 bg-current rounded-full animate-bounce',
          dotClassName
        )}
        style={{ animationDelay: '150ms' }}
      ></div>
      <div
        className={cn(
          'w-2 h-2 bg-current rounded-full animate-bounce',
          dotClassName
        )}
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  )
}
