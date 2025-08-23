'use client'

import { formatDateTime } from '@/lib/utils'
import { IOrder } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Truck, Package, CheckCircle, Clock, Eye } from 'lucide-react'
import ProductPrice from '../product/product-price'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function RecentOrdersList({ orders }: { orders: IOrder[] }) {
  const router = useRouter()
  const t = useTranslations()

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center py-6'>
            <p>{t('Orders.NoRecentOrders')}</p>
            <Link
              href='/search'
              className='text-primary hover:underline mt-2 block'
            >
              {t('Orders.ContinueShopping')}
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    if (status === 'delivered')
      return <CheckCircle className='h-5 w-5 text-green-500' />
    if (status === 'shipped') return <Truck className='h-5 w-5 text-blue-500' />
    if (status === 'processing')
      return <Package className='h-5 w-5 text-orange-500' />
    return <Clock className='h-5 w-5 text-gray-500' />
  }

  const getStatusColor = (status: string) => {
    if (status === 'delivered')
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    if (status === 'shipped')
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    if (status === 'processing')
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  return (
    <div className='space-y-4'>
      {orders.slice(0, 3).map((order) => (
        <Card key={order._id} className='overflow-hidden'>
          <div className='bg-muted/50 p-4 flex justify-between items-center border-b'>
            <div>
              <p className='text-sm text-muted-foreground'>
                {formatDateTime(new Date(order.createdAt)).dateOnly}
              </p>
              <p className='font-medium'>
                {t('Orders.Order')} #{order._id.substring(order._id.length - 8)}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge
                className={getStatusColor(
                  order.isDelivered
                    ? 'delivered'
                    : order.isShipped
                      ? 'shipped'
                      : 'processing'
                )}
              >
                <span className='flex items-center gap-1'>
                  {getStatusIcon(
                    order.isDelivered
                      ? 'delivered'
                      : order.isShipped
                        ? 'shipped'
                        : 'processing'
                  )}
                  {order.isDelivered
                    ? t('Orders.Delivered')
                    : order.isShipped
                      ? t('Orders.Shipped')
                      : t('Orders.Processing')}
                </span>
              </Badge>
              <Button
                size='sm'
                variant='ghost'
                className='p-1 h-8'
                onClick={() => router.push(`/account/orders/${order._id}`)}
              >
                <Eye className='h-4 w-4 mr-1' />
                <span>{t('Orders.Details')}</span>
              </Button>
            </div>
          </div>
          <CardContent className='p-4'>
            <div className='flex flex-col space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>{t('Cart.Total')}:</span>
                <span className='font-semibold'>
                  <ProductPrice price={order.totalPrice} plain />
                </span>
              </div>

              <div className='grid gap-3'>
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.clientId} className='flex items-center gap-3'>
                    <div className='relative w-12 h-12 flex-shrink-0 border rounded overflow-hidden'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className='object-contain'
                        sizes='48px'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {item.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {t('Orders.Quantity', { quantity: item.quantity })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.items.length > 2 && (
                <p className='text-xs text-muted-foreground text-right'>
                  {t('Orders.MoreItems', { count: order.items.length - 2 })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {orders.length > 3 && (
        <div className='text-center mt-4'>
          <Button
            variant='outline'
            onClick={() => router.push('/account/orders')}
          >
            {t('Orders.ViewAllOrders')}
          </Button>
        </div>
      )}
    </div>
  )
}
