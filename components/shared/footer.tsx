'use client'
import { memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import useSettingStore from '@/hooks/use-setting-store'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

// Lazy-load ChevronUp to reduce initial JS size
const ChevronUp = dynamic(
  () => import('lucide-react').then((m) => m.ChevronUp),
  { ssr: false }
)

function FooterComponent() {
  const {
    setting: { site, availableCurrencies, currency },
    setCurrency,
  } = useSettingStore()
  const t = useTranslations()

  const handleCurrencyChange = useCallback(
    (value: string) => {
      setCurrency(value)
      window.scrollTo({ top: 0 })
    },
    [setCurrency]
  )

  return (
    <footer className='bg-header text-white mt-20 relative overflow-hidden border-t border-header-darker'>
      {/* Decorative background elements with subtle professional styling */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl'></div>
      </div>

      <div className='relative z-10 w-full'>
        {/* Back to top button with enhanced styling */}
        <div className='border-b border-header-darker'>
          <Button
            variant='ghost'
            className='group w-full bg-header-darker hover:bg-primary/10 rounded-none py-4 text-gray-200 hover:text-white font-medium transition-all duration-300'
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ChevronUp className='mr-2 h-5 w-5 group-hover:transform group-hover:-translate-y-1 transition-transform duration-300' />
            <span className='text-white'>{t('Footer.Back to top')}</span>
          </Button>
        </div>

        {/* Main footer content */}
        <div className='border-b border-header-darker'>
          <div className='max-w-7xl mx-auto py-16 px-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12'>
              {/* Brand Section */}
              <div className='lg:col-span-2 space-y-6'>
                <div className='flex items-center space-x-4'>
                  <div className='relative group'>
                    <div className='absolute inset-0 bg-primary/20 rounded-full opacity-75 group-hover:opacity-100 filter blur-sm transition-opacity duration-300'></div>
                    <Image
                      src={site.logo}
                      alt={`${site.name} logo`}
                      width={64}
                      height={64}
                      priority
                      className='relative rounded-full shadow-2xl'
                    />
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold text-white'>
                      {site.name}
                    </h3>
                    <p className='text-gray-300 text-sm mt-1'>
                      Your trusted shopping destination
                    </p>
                  </div>
                </div>

                <p className='text-gray-300 leading-relaxed max-w-md'>
                  Experience premium quality products with exceptional service.
                  We bring you the best from around the world, delivered right
                  to your doorstep.
                </p>

                {/* Contact Info */}
                <div className='space-y-2 text-sm text-gray-300'>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-4 h-4 text-primary'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z'></path>
                      <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'></path>
                    </svg>
                    <span>{site.address}</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-4 h-4 text-primary'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z'></path>
                    </svg>
                    <span>{site.phone}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className='space-y-6'>
                <h4 className='text-lg font-semibold text-white'>
                  Quick Links
                </h4>
                <div className='space-y-3'>
                  <Link
                    href='/page/about-us'
                    className='block text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-200'
                  >
                    About Us
                  </Link>
                  <Link
                    href='/page/customer-service'
                    className='block text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-200'
                  >
                    Customer Service
                  </Link>
                  <Link
                    href='/page/contact-us'
                    className='block text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-200'
                  >
                    Contact Us
                  </Link>
                  <Link
                    href='/page/help'
                    className='block text-gray-300 hover:text-primary hover:translate-x-1 transition-all duration-200'
                  >
                    Help Center
                  </Link>
                </div>
              </div>

              {/* Currency & Settings */}
              <div className='space-y-6'>
                <h4 className='text-lg font-semibold text-white'>
                  Preferences
                </h4>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm text-gray-300 mb-2'>
                      Currency
                    </label>
                    <Select
                      value={currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className='bg-header-darker border-gray-600 text-white hover:bg-gray-700/50 transition-colors duration-200'>
                        <SelectValue
                          placeholder={t('Footer.Select a currency')}
                        />
                      </SelectTrigger>
                      <SelectContent className='bg-header border-gray-600'>
                        {availableCurrencies
                          ?.filter((x) => x.code)
                          .map((c, index) => (
                            <SelectItem
                              key={index}
                              value={c.code}
                              className='text-white hover:bg-primary/20 focus:bg-primary/20'
                            >
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className='py-8 px-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Legal Links */}
            <div className='flex flex-wrap justify-center gap-6 mb-6'>
              <Link
                href='/page/conditions-of-use'
                className='text-sm text-gray-300 hover:text-primary transition-colors duration-200 hover:underline underline-offset-4'
              >
                {t('Footer.Conditions of Use')}
              </Link>
              <Link
                href='/page/privacy-policy'
                className='text-sm text-gray-300 hover:text-primary transition-colors duration-200 hover:underline underline-offset-4'
              >
                {t('Footer.Privacy Notice')}
              </Link>
              <Link
                href='/page/help'
                className='text-sm text-gray-300 hover:text-primary transition-colors duration-200 hover:underline underline-offset-4'
              >
                {t('Footer.Help')}
              </Link>
            </div>

            {/* Copyright */}
            <div className='text-center'>
              <p className='text-sm text-gray-300'>© {site.copyright}</p>
              <p className='text-xs text-gray-400 mt-2'>
                Built with ❤️ for an exceptional shopping experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default memo(FooterComponent)
