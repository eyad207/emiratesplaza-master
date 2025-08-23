import { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'

import { auth } from '@/auth'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

const PAGE_TITLE = 'Login & Security'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}
export default async function ProfilePage() {
  const t = await getTranslations() // Initialize translations
  const session = await auth()

  return (
    <div className='mb-24'>
      <SessionProvider session={session}>
        <div className='flex gap-2 '>
          <Link href='/account'>{t('Account.Your Account')}</Link>{' '}
          {/* Translate breadcrumb */}
          <span>›</span>
          <span>{t('Account.LoginSecurity')}</span> {/* Translate page title */}
        </div>
        <h1 className='h1-bold py-4'>{t('Account.LoginSecurity')}</h1>{' '}
        {/* Translate page title */}
        <Card className='max-w-2xl '>
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Account.Name')}</h3>{' '}
              {/* Translate Name */}
              <p>{session?.user.name}</p>
            </div>
            <div>
              <Link href='/account/manage/name'>
                <Button className='rounded-full w-32' variant='outline'>
                  {t('Account.Edit')} {/* Translate Edit */}
                </Button>
              </Link>
            </div>
          </CardContent>
          <Separator />
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Account.Email')}</h3>{' '}
              {/* Translate Email */}
              <p>{session?.user.email}</p>
            </div>
            <div>
              <Link href='/account/manage/email'>
                <Button className='rounded-full w-32' variant='outline'>
                  {t('Account.Edit')} {/* Translate Edit */}
                </Button>
              </Link>
            </div>
          </CardContent>
          <Separator />
          <CardContent className='p-4 flex justify-between flex-wrap'>
            <div>
              <h3 className='font-bold'>{t('Account.Password')}</h3>{' '}
              {/* Translate Password */}
              <p>************</p>
            </div>
            <div>
              <Link href='/account/manage/password'>
                <Button className='rounded-full w-32' variant='outline'>
                  {t('Account.Edit')} {/* Translate Edit */}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  )
}
