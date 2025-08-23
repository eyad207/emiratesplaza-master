'use client'

import { ShoppingCartIcon } from 'lucide-react'
import useIsMounted from '@/hooks/use-is-mounted'
import { cn } from '@/lib/utils'
import useCartStore from '@/hooks/use-cart-store'
import { useLocale, useTranslations } from 'next-intl'
import { getDirection } from '@/i18n-config'
import { useCartSidebarStore } from '@/hooks/use-cart-sidebar-store'

export default function CartButton() {
  const isMounted = useIsMounted()
  const { toggleSidebar } = useCartSidebarStore()
  const {
    cart: { items },
  } = useCartStore()
  const cartItemsCount = items.reduce((a, c) => a + c.quantity, 0)
  const t = useTranslations()
  const locale = useLocale()

  return (
    <button
      onClick={toggleSidebar}
      className='px-2 py-1.5 header-button rounded-md flex items-center gap-1'
    >
      <div className='flex items-center text-xs relative'>
        <div className='relative'>
          <ShoppingCartIcon className='h-6 w-6 sm:h-7 sm:w-7' />
          {isMounted && cartItemsCount > 0 && (
            <span
              className={cn(
                `absolute bg-primary px-1 rounded-full text-black text-xs font-bold ${
                  getDirection(locale) === 'rtl' ? '-right-1' : '-right-1'
                } -top-1 z-10 min-w-[18px] h-[18px] flex items-center justify-center`,
                cartItemsCount >= 10 && 'text-[10px] px-0'
              )}
            >
              {cartItemsCount}
            </span>
          )}
        </div>
        <span className='font-bold text-sm ml-1 hidden sm:inline'>
          {t('Header.Cart')}
        </span>
      </div>
    </button>
  )
}
