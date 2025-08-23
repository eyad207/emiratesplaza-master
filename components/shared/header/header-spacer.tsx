'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export default function HeaderSpacer() {
  const [headerHeight, setHeaderHeight] = useState(0)
  const observerRef = useRef<MutationObserver | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const calculateHeaderHeight = useCallback(() => {
    try {
      const header = document.querySelector('header')
      if (header) {
        const height = header.getBoundingClientRect().height
        setHeaderHeight((prevHeight) =>
          prevHeight !== height ? height : prevHeight
        )
      }
    } catch {
      // Silently handle header height calculation errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    calculateHeaderHeight()

    const header = document.querySelector('header')
    if (!header) return

    let cleanupResize: (() => void) | undefined

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.contentRect.height
          setHeaderHeight((prevHeight) =>
            prevHeight !== height ? height : prevHeight
          )
        }
      })
      resizeObserverRef.current.observe(header)
    } else {
      const handleResize = () => calculateHeaderHeight()
      window.addEventListener('resize', handleResize, { passive: true })
      cleanupResize = () => window.removeEventListener('resize', handleResize)

      observerRef.current = new MutationObserver(calculateHeaderHeight)
      observerRef.current.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      })
    }

    return () => {
      resizeObserverRef.current?.disconnect()
      observerRef.current?.disconnect()
      cleanupResize?.()
    }
  }, [calculateHeaderHeight])

  if (!headerHeight || headerHeight <= 0) {
    return null
  }

  return (
    <div
      style={{ height: `${headerHeight}px` }}
      className='w-full flex-shrink-0'
      role='presentation'
      aria-hidden='true'
    />
  )
}
