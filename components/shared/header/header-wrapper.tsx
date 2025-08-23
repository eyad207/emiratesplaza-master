'use client'

import { useHeaderScroll } from '@/hooks/use-header-scroll'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface HeaderWrapperProps {
  children: ReactNode
}

export default function HeaderWrapper({ children }: HeaderWrapperProps) {
  const { isVisible, isAtTop } = useHeaderScroll({
    threshold: 10,
    hideOffset: 80,
  })

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out will-change-transform',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
        !isAtTop &&
          'shadow-lg backdrop-blur-sm bg-header/95 supports-[backdrop-filter]:bg-header/85'
      )}
      style={{
        // Use transform3d for better GPU acceleration
        transform: isVisible
          ? 'translate3d(0, 0, 0)'
          : 'translate3d(0, -100%, 0)',
      }}
    >
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          !isAtTop && 'border-b border-white/10'
        )}
      >
        {children}
      </div>
    </div>
  )
}
