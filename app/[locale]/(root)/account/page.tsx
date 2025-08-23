import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import RecentOrdersList from '@/components/shared/account/recent-orders-list'
import { Card, CardContent } from '@/components/ui/card'
import { PackageCheckIcon, ShieldCheckIcon } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { auth } from '@/auth'
import { getRecentOrders } from '@/lib/actions/order.actions'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Your Account',
}

export default async function AccountPage() {
  const session = await auth()
  const userName = session?.user?.name || 'there'
  const t = await getTranslations() // Initialize translations
  // Fetch recent orders if user is logged in
  const recentOrders = session?.user?.id
    ? await getRecentOrders(session.user.id)
    : []

  const accountCards = [
    {
      title: t('Account.Orders'), // Translate title
      description: t('Account.TrackReturnBuy'), // Translate description
      icon: <PackageCheckIcon className='w-8 h-8 text-primary' />,
      href: '/account/orders',
    },
    {
      title: t('Account.LoginSecurity'), // Translate title
      description: t('Account.Edit Login Name Mobile'), // Translate description
      icon: <ShieldCheckIcon className='w-8 h-8 text-primary' />,
      href: '/account/manage',
    },
  ]

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
          {t('Dashboard.Hello')}, {userName} {/* Translate greeting */}
        </h1>
        <p className='text-muted-foreground'>
          {t('Dashboard.WelcomeMessage')} {/* Translate welcome message */}
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6'>
        {accountCards.map((card, index) => (
          <Link href={card.href} key={index} className='block h-full'>
            <Card className='h-full hover:shadow-lg transition-transform duration-300 transform hover:scale-105 bg-card'>
              <CardContent className='p-5 md:p-6 flex gap-4 h-full'>
                <div className='shrink-0'>{card.icon}</div>
                <div className='space-y-1.5'>
                  <h2 className='text-lg font-semibold'>{card.title}</h2>
                  <p className='text-sm text-muted-foreground'>
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className='space-y-4'>
        <div>
          <h2 className='text-xl font-bold'>{t('Dashboard.RecentOrders')}</h2>{' '}
          {/* Translate section title */}
          <p className='text-muted-foreground text-sm'>
            {t('Dashboard.QuickAccess')} {/* Translate description */}
          </p>
        </div>

        {/* Use our new component to display recent orders */}
        <RecentOrdersList orders={recentOrders} />
      </div>

      <Separator className='my-8' />

      <div>
        <BrowsingHistoryList />
      </div>
    </div>
  )
}
