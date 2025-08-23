import { auth } from '@/auth'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOut } from '@/lib/actions/user.actions'
import { ChevronDownIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function UserButton() {
  const t = await getTranslations()
  const session = await auth()
  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger
          className='header-button hidden nav:flex'
          asChild
          aria-label={
            session
              ? `User menu for ${session.user.name}`
              : 'User account menu - sign in or sign up'
          }
          aria-expanded={false}
          aria-haspopup='menu'
        >
          <div className='flex items-center' role='button' tabIndex={0}>
            <div className='flex flex-col text-xs text-left'>
              <span>
                {t('Header.Hello')},{' '}
                {session ? session.user.name : t('Header.sign in')}
              </span>
              <span className='font-bold'>{t('Header.Account & Orders')}</span>
            </div>
            <ChevronDownIcon
              className='transition-transform duration-200'
              aria-hidden='true'
            />
          </div>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent
            className='w-56 bg-white text-black shadow-md rounded-lg p-2'
            align='end'
            forceMount
            role='menu'
            aria-label='User account menu'
          >
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none'>
                  {session.user.name}
                </p>
                <p className='text-xs leading-none'>{session.user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup role='group' aria-label='Account actions'>
              <Link className='w-full' href='/account'>
                <DropdownMenuItem
                  className='hover:bg-primary/10 transition-colors'
                  role='menuitem'
                  aria-label='Go to your account page'
                >
                  {t('Header.Your account')}
                </DropdownMenuItem>
              </Link>
              <Link className='w-full' href='/account/orders'>
                <DropdownMenuItem
                  className='hover:bg-primary/10 transition-colors'
                  role='menuitem'
                  aria-label='View your orders'
                >
                  {t('Header.Your orders')}
                </DropdownMenuItem>
              </Link>

              {session.user.role === 'Admin' && (
                <Link className='w-full' href='/admin/overview'>
                  <DropdownMenuItem
                    className='hover:bg-primary/10 transition-colors'
                    role='menuitem'
                    aria-label='Go to admin dashboard'
                  >
                    {t('Header.Admin')}
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
            <DropdownMenuItem className='p-0 mb-1'>
              <form action={SignOut} className='w-full'>
                <Button
                  className='w-full py-4 px-2 h-4 justify-start'
                  variant='ghost'
                  type='submit'
                  role='menuitem'
                  aria-label='Sign out of your account'
                >
                  {t('Header.Sign out')}
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent
            className='w-56 bg-white text-black shadow-lg rounded-xl p-2 border border-gray-200'
            align='end'
            forceMount
            role='menu'
            aria-label='Account sign in menu'
          >
            {/* Main actions */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className='p-0'>
                <Link
                  className='flex items-center justify-center w-full px-4 py-2 rounded-md text-sm font-semibold text-black bg-amber-400 cursor-pointer hover:bg-amber-500 hover:text-black transition-colors duration-200 ease-in-out'
                  href='/sign-in'
                >
                  {t('Header.Sign in')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Separator */}
            <div className='my-2 border-t border-gray-100' />

            {/* New customer section */}
            <DropdownMenuLabel className='text-center text-sm font-normal text-gray-500 px-2'>
              {t('Header.New Customer')}?{' '}
              <Link
                href='/sign-up'
                className='font-medium text-primary hover:text-primary/80 hover:underline ml-1 transition-colors duration-200'
              >
                {t('Header.Sign up')}
              </Link>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}
