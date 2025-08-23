import { getSetting } from '@/lib/actions/setting.actions'
import { HelpCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { cache } from 'react'

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch everything in parallel
  const getCachedSettings = cache(getSetting)
  const [settings] = await Promise.all([getCachedSettings()])
  const { site } = settings

  return (
    <div className='min-h-screen bg-zinc-100 dark:bg-zinc-900'>
      {/* Modern Header */}
      <header className='bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-50 shadow-sm border-b border-zinc-200 dark:border-zinc-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16 md:h-20'>
            {/* Logo */}
            <Link href='/' className='flex items-center space-x-3 group'>
              <div className='relative'>
                <Image
                  src={site.logo}
                  alt='logo'
                  width={50}
                  height={50}
                  className='transition-transform group-hover:scale-105'
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </div>
            </Link>

            {/* Checkout Title */}
            <div className='text-center'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground'>
                Checkout
              </h1>
            </div>

            {/* Help Link */}
            <Link
              href='/page/help'
              className='flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            >
              <HelpCircle className='w-5 h-5' />
              <span className='hidden sm:inline text-sm font-medium'>Help</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>{children}</div>
      </main>

      {/* Footer */}
      <footer className='bg-zinc-100/80 backdrop-blur-sm border-t border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-2 mb-4'>
              <Image
                src={site.logo}
                alt='logo'
                width={32}
                height={32}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              <span className='text-lg font-semibold text-foreground'>
                {site.name}
              </span>
            </div>
            <p className='text-sm text-muted-foreground'>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
            <div className='flex items-center justify-center space-x-6 mt-4 text-sm'>
              <Link
                href='/page/privacy'
                className='text-muted-foreground hover:text-primary transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='/page/terms'
                className='text-muted-foreground hover:text-primary transition-colors'
              >
                Terms of Service
              </Link>
              <Link
                href='/page/help'
                className='text-muted-foreground hover:text-primary transition-colors'
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
