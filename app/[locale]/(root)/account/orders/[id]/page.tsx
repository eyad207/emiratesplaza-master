import { notFound } from 'next/navigation'
import React from 'react'
import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import Link from 'next/link'
import { formatId } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const t = await getTranslations()

  return {
    title: `${t('Orders.Order')} ${formatId(params.id)}`,
  }
}

export default async function OrderDetailsPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const { id } = params

  const t = await getTranslations()
  const order = await getOrderById(id)
  if (!order || (!order.isPaid && order.paymentMethod !== 'Cash On Delivery')) {
    notFound() // Redirect if order is not paid and not COD
  }

  const session = await auth()

  return (
    <>
      {/* Enhanced breadcrumb navigation */}
      <div className='flex items-center gap-2 text-sm text-muted-foreground mb-6'>
        <Link
          href='/account'
          className='hover:text-foreground transition-colors'
        >
          {t('Account.Your Account')}
        </Link>
        <ChevronRight className='h-4 w-4' />
        <Link
          href='/account/orders'
          className='hover:text-foreground transition-colors'
        >
          {t('Orders.Your Orders')}
        </Link>
        <ChevronRight className='h-4 w-4' />
        <span className='font-medium text-foreground'>
          {t('Orders.Order')} #{formatId(order._id)}
        </span>
      </div>

      {/* Order Details Header */}
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold mb-1'>
          {t('Orders.Order')} #{order._id}
        </h1>
        <p className='text-muted-foreground'>
          {t('Orders.PlacedOn')}{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card className='overflow-hidden border-border/40 mb-6'>
        <div className='bg-muted/50 p-4 border-b'>
          <h2 className='font-semibold'>{t('Orders.OrderStatus')}</h2>
        </div>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between'>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>
                {t('Orders.PaymentStatus')}
              </p>
              <p className='font-medium flex items-center gap-2'>
                <span
                  className={`w-2 h-2 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-amber-500'}`}
                ></span>
                {order.isPaid ? t('Orders.Paid') : t('Orders.PaymentPending')}
              </p>
            </div>

            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>
                {t('Orders.Shipping Status')}
              </p>
              <p className='font-medium flex items-center gap-2'>
                <span
                  className={`w-2 h-2 rounded-full ${order.isShipped ? 'bg-blue-500' : 'bg-gray-400'}`}
                ></span>
                {order.isShipped ? t('Orders.Shipped') : t('Orders.Processing')}
              </p>
            </div>

            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>
                {t('Orders.Delivery Status')}
              </p>
              <p className='font-medium flex items-center gap-2'>
                <span
                  className={`w-2 h-2 rounded-full ${order.isDelivered ? 'bg-green-500' : 'bg-gray-400'}`}
                ></span>
                {order.isDelivered
                  ? t('Orders.Delivered')
                  : t('Orders.Not Delivered Yet')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Expected delivery information */}
      {order.expectedDeliveryDate && (
        <Card className='mt-6'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-sm'>
              <p className='text-muted-foreground'>
                {t('Orders.ExpectedDeliveryBy')}:
              </p>
              <p className='font-medium'>
                {new Date(order.expectedDeliveryDate).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Order Details Form wrapped in a card */}
      <div className='rounded-lg overflow-hidden border border-border/40 shadow-sm'>
        <h2 className='font-semibold p-4'>{t('Orders.OrderDetailsForm')}</h2>
        <OrderDetailsForm
          order={order}
          isAdmin={session?.user?.role === 'Admin' || false}
        />
      </div>
    </>
  )
}
