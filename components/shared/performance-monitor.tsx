'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming

          // Log important metrics
          console.log('Performance Metrics:', {
            domContentLoaded:
              navigationEntry.domContentLoadedEventEnd -
              navigationEntry.domContentLoadedEventStart,
            loadComplete:
              navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
            firstPaint: performance
              .getEntriesByType('paint')
              .find((p) => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: performance
              .getEntriesByType('paint')
              .find((p) => p.name === 'first-contentful-paint')?.startTime,
          })
        }
      }
    })

    observer.observe({ entryTypes: ['navigation', 'paint'] })

    return () => observer.disconnect()
  }, [])

  return null
}
