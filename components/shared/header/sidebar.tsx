import * as React from 'react'
import Link from 'next/link'
import { X, ChevronRight, UserCircle, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignOut } from '@/lib/actions/user.actions'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { auth } from '@/auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { getDirection } from '@/i18n-config'

export default async function Sidebar({
  categories,
}: {
  categories: Array<{ original: string; translated: string }>
}) {
  const session = await auth()

  const locale = await getLocale()

  const t = await getTranslations()
  return (
    <Drawer direction={getDirection(locale) === 'rtl' ? 'right' : 'left'}>
      <DrawerTrigger className='flex items-center gap-2 py-2 px-4 hover:bg-white/10 transition-colors duration-200 rounded-md'>
        <MenuIcon className='h-4 w-4' />
        <span className='text-sm font-medium'>
          {t('Header.All Categories')}
        </span>
      </DrawerTrigger>
      <DrawerContent className='w-[250px] mt-0 top-0 dark:bg-zinc-900 white:bg-white dark:text-white white:bg-slate-200 '>
        <div className='flex flex-col h-full'>
          {/* User Sign In Section */}
          <div className='dark bg-gray-800 text-foreground flex items-center justify-between'>
            <DrawerHeader>
              <DrawerTitle className='flex items-center'>
                <UserCircle className='h-6 w-6 mr-2' />
                {session ? (
                  <DrawerClose asChild>
                    <Link href='/account'>
                      <span className='text-lg font-semibold'>
                        {t('Header.Hello')}, {session.user.name}
                      </span>
                    </Link>
                  </DrawerClose>
                ) : (
                  <DrawerClose asChild>
                    <Link href='/sign-in'>
                      <span className='text-lg font-semibold'>
                        {t('Header.Hello')}, {t('Header.sign in')}
                      </span>
                    </Link>
                  </DrawerClose>
                )}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <Button variant='ghost' size='icon' className='mr-2'>
                <X className='h-5 w-5' />
                <span className='sr-only'>Close</span>
              </Button>
            </DrawerClose>
          </div>

          {/* Shop By Category */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-4 border-b'>
              <h2 className='text-lg font-semibold'>
                {t('Header.Shop By Department')}
              </h2>
            </div>{' '}
            <nav className='flex flex-col'>
              {categories.map((category) => (
                <DrawerClose asChild key={category.original}>
                  <Link
                    href={`/search?category=${category.original}&q=all`}
                    className='flex items-center justify-between py-2 px-4 hover:bg-primary/10 transition-colors rounded-md'
                  >
                    <span>{category.translated}</span>
                    <ChevronRight className='h-4 w-4' />
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Setting and Help */}
          <div className='border-t flex flex-col'>
            <div className='p-4'>
              <h2 className='text-lg font-semibold'>
                {t('Header.Help & Settings')}
              </h2>
            </div>
            <DrawerClose asChild>
              <Link
                href='/account'
                className='py-2 px-4 hover:bg-primary/10 transition-colors rounded-md'
              >
                {t('Header.Your account')}
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link
                href='/page/customer-service'
                className='py-2 px-4 hover:bg-primary/10 transition-colors rounded-md'
              >
                {t('Header.Customer Service')}
              </Link>
            </DrawerClose>
            {session ? (
              <form action={SignOut} className='w-full'>
                <Button
                  className='w-full justify-start py-2 px-4 hover:bg-primary/10 transition-colors rounded-md'
                  variant='ghost'
                >
                  {t('Header.Sign out')}
                </Button>
              </form>
            ) : (
              <Link
                href='/sign-in'
                className='py-2 px-4 hover:bg-primary/10 transition-colors rounded-md'
              >
                {t('Header.Sign in')}
              </Link>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
