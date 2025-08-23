'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)

    // You can send the metric to your analytics service here
    const body = JSON.stringify({
      ...metric,
      page: window.location.pathname,
    })

    if (
      metric.name === 'LCP' ||
      metric.name === 'FID' ||
      metric.name === 'CLS'
    ) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/vitals', blob)
    }
  })

  return null
}
