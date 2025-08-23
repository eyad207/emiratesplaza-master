import { Menu as MenuIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import CartButton from './cart-button'
import UserButton from './user-button'
import ThemeSwitcher from './theme-switcher'
import LanguageSwitcher from './language-switcher'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignOut } from '@/lib/actions/user.actions'
import CurrencySwitcher from './currency-switcher'
import { NavigationButton } from './navigation-button'

const Menu = async ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const t = await getTranslations()
  // fetch current user session for mobile menu actions
  const session = await import('@/auth').then((mod) => mod.auth())
  return (
    <div className='flex items-center'>
      {/* Desktop menu - visible above 1000px */}
      <nav className='hidden nav:flex items-center gap-3 lg:gap-4'>
        <div className='flex items-center gap-2'>
          <CurrencySwitcher />
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className='flex items-center'>
          <UserButton />
          {!forAdmin && <CartButton />}
        </div>
      </nav>

      {/* Mobile menu - visible below 1000px */}
      <nav className='flex items-center nav:hidden'>
        <CartButton />
        <Sheet>
          <SheetTrigger className='header-button !p-1.5 rounded-md hover:bg-white/10 transition-colors'>
            <MenuIcon className='h-5 w-5' />
          </SheetTrigger>

          <SheetContent
            className='bg-header text-white flex flex-col py-6 w-60'
            side='right'
          >
            <SheetHeader className='w-full text-left'>
              <SheetTitle className='text-white text-xl'>
                {t('Header.Menu')}
              </SheetTitle>
            </SheetHeader>

            <div className='mt-6 flex flex-col gap-5 flex-1'>
              {/* Account Section */}
              <div className='space-y-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-white/70'>
                  {t('Header.Your Account')}
                </h3>
                <div className='space-y-3 flex flex-col'>
                  <SheetClose asChild>
                    <NavigationButton
                      href='/account'
                      className='py-2 px-4 bg-white/10 rounded-md hover:bg-primary/10 transition-colors text-sm justify-start'
                    >
                      {t('Header.Your account')}
                    </NavigationButton>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavigationButton
                      href='/account/orders'
                      className='py-2 px-4 bg-white/10 rounded-md hover:bg-primary/10 transition-colors text-sm justify-start'
                    >
                      {t('Header.Your orders')}
                    </NavigationButton>
                  </SheetClose>
                  {/* Admin dashboard link */}
                  {session?.user.role === 'Admin' && (
                    <SheetClose asChild>
                      <Link
                        href='/admin/overview'
                        className='py-2 px-4 bg-white/10 rounded-md hover:bg-primary/10 transition-colors text-sm'
                      >
                        {t('Header.Admin')}
                      </Link>
                    </SheetClose>
                  )}
                  {/* Sign out button */}
                  {session ? (
                    <SheetClose asChild>
                      <form action={SignOut} className='w-full'>
                        <Button
                          className='w-full py-2 px-4 bg-white/10 rounded-md hover:bg-primary/10 transition-colors text-sm'
                          variant='ghost'
                          type='submit'
                        >
                          {t('Header.Sign out')}
                        </Button>
                      </form>
                    </SheetClose>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href='/sign-in'
                        className='py-2 px-4 bg-white/10 rounded-md hover:bg-primary/10 transition-colors text-sm'
                        aria-label={t('Header.Sign in')}
                      >
                        {t('Header.Sign in')}
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </div>

              {/* Preferences Section */}
              <div className='space-y-4 pt-4 border-t border-white/10'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-white/70'>
                  {t('Header.Preferences')}
                </h3>
                <div className='space-y-3'>
                  <CurrencySwitcher />
                  <LanguageSwitcher />
                  <ThemeSwitcher />
                </div>
              </div>

              {/* Help & Support */}
              <div className='space-y-4 pt-4 border-t border-white/10 mt-auto'>
                <h3 className='text-sm font-semibold uppercase tracking-wider text-white/70'>
                  {t('Header.Help & Support')}
                </h3>
                <div className='space-y-2'>
                  <SheetClose asChild>
                    <Link
                      href='/page/customer-service'
                      className='flex py-2 text-sm hover:text-primary transition-colors'
                    >
                      {t('Header.Customer Service')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href='/page/about'
                      className='flex py-2 text-sm hover:text-primary transition-colors'
                    >
                      {t('Header.About Us')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href='/page/contact'
                      className='flex py-2 text-sm hover:text-primary transition-colors'
                    >
                      {t('Header.Contact Us')}
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
