import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import ClientProviders from '@/components/shared/client-providers'

// Remove force-dynamic for better performance
export const revalidate = 3600 // revalidate every hour
import { getDirection } from '@/i18n-config'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { getSetting } from '@/lib/actions/setting.actions'
import { cookies } from 'next/headers'
import CartSidebar from '@/components/shared/cart-sidebar'
import { NextAuthProvider } from '@/components/providers/session-provider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import { WebVitals } from '@/components/shared/web-vitals'
import { PerformanceMonitor } from '@/components/shared/performance-monitor'

// Optimize font loading with display swap
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Only preload primary font
})

import { Metadata } from 'next'

// Cache metadata for better performance
let cachedMetadata: Metadata | null = null

export async function generateMetadata(): Promise<Metadata> {
  if (cachedMetadata) {
    return cachedMetadata
  }

  try {
    const {
      site: { slogan, name, description, url },
    } = await getSetting()

    cachedMetadata = {
      title: {
        template: `%s | ${name}`,
        default: `${name}. ${slogan}`,
      },
      description: description,
      metadataBase: new URL(url),
      // Add additional SEO optimizations
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      },
    }

    return cachedMetadata
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Emirates Plaza',
      description: 'Your online shopping destination',
    }
  }
}

export default async function AppLayout({
  params,
  children,
}: {
  params: { locale: string }
  children: React.ReactNode
}) {
  const setting = await getSetting()
  const currencyCookie = (await cookies()).get('currency')
  const currency = currencyCookie ? currencyCookie.value : 'NOK'

  const { locale } = await params
  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === 'rtl' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        {/* Add resource hints for better performance */}
        <link rel='dns-prefetch' href='//fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin=''
        />
        <link rel='preconnect' href='https://utfs.io' crossOrigin='' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </head>
      <body
        className={`min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders setting={{ ...setting, currency }}>
            <NextAuthProvider>{children}</NextAuthProvider>
          </ClientProviders>
          <CartSidebar />
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics mode='auto' />
        <WebVitals />
        <PerformanceMonitor />
      </body>
    </html>
  )
}
