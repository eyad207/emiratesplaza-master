import { usePathname } from 'next/navigation'
import useCartStore from './use-cart-store'
import { i18n } from '@/i18n-config'
import { useEffect, useState } from 'react'

const locales = i18n.locales
  .filter((locale) => locale.code !== 'en-US')
  .map((locale) => locale.code)

const isNotInPaths = (s: string) => {
  const localePattern = `/(?:${locales.join('|')})` // Match locales
  const pathsPattern = `^(?:${localePattern})?(?:/$|/cart$|/checkout$|/sign-in$|/sign-up$|/order(?:/.*)?$|/account(?:/.*)?$|/admin(?:/.*)?$)?$`
  return !new RegExp(pathsPattern).test(s)
}

function useCartSidebar() {
  const {
    cart: { items },
  } = useCartStore()
  const currentPath = usePathname()
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  // Check for large screens
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    items.length > 0 &&
    isLargeScreen &&
    currentPath !== null &&
    isNotInPaths(currentPath)
  )
}

export default useCartSidebar
