'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface UseHeaderScrollOptions {
  threshold?: number
  hideOffset?: number
}

export function useHeaderScroll({
  threshold = 10,
  hideOffset = 100,
}: UseHeaderScrollOptions = {}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isAtTop, setIsAtTop] = useState(true)
  const tickingRef = useRef(false)

  const handleScroll = useCallback(() => {
    try {
      const currentScrollY = window.scrollY

      // Validate scroll position is a valid number
      if (typeof currentScrollY !== 'number' || isNaN(currentScrollY)) {
        return
      }

      // Check if we're at the top of the page
      const atTop = currentScrollY <= threshold
      setIsAtTop(atTop)

      // If we're at the top, always show the header
      if (atTop) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // Determine scroll direction
      const scrollingDown = currentScrollY > lastScrollY
      const scrollingUp = currentScrollY < lastScrollY

      // Only hide/show if we've scrolled enough
      const scrollDifference = Math.abs(currentScrollY - lastScrollY)

      if (scrollDifference < threshold) {
        return
      }

      // Hide header when scrolling down (after hideOffset pixels)
      if (scrollingDown && currentScrollY > hideOffset) {
        setIsVisible(false)
      }
      // Show header when scrolling up
      else if (scrollingUp) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    } catch (error) {
      // Silently handle any errors to prevent breaking the UI
      
    }
  }, [lastScrollY, threshold, hideOffset])

  useEffect(() => {
    // Early return if not in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Optimized scroll handler with requestAnimationFrame throttling
    const throttledScrollHandler = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          handleScroll()
          tickingRef.current = false
        })
        tickingRef.current = true
      }
    }

    // Set initial scroll position
    try {
      setLastScrollY(window.scrollY)
      setIsAtTop(window.scrollY <= threshold)
    } catch (error) {
      
    }

    window.addEventListener('scroll', throttledScrollHandler, {
      passive: true,
      capture: false,
    })

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler)
      tickingRef.current = false
    }
  }, [handleScroll, threshold])

  return {
    isVisible,
    isAtTop,
  }
}
