'use client'
import {
  BadgeDollarSign,
  Barcode,
  CreditCard,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calculatePastDate, formatDateTime, formatNumber } from '@/lib/utils'

import SalesCategoryPieChart from './sales-category-pie-chart'

import React, { useEffect, useState, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { getOrderSummary } from '@/lib/actions/order.actions'
import SalesAreaChart from './sales-area-chart'
import { CalendarDateRangePicker } from './date-range-picker'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'
import { Skeleton } from '@/components/ui/skeleton'
import TableChart from './table-chart'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent } from '@/components/ui/tabs'

export default function OverviewReport() {
  const t = useTranslations('Admin')
  const [date, setDate] = useState<DateRange | undefined>({
    from: calculatePastDate(30),
    to: new Date(),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<{ [key: string]: any }>()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (date) {
      startTransition(async () => {
        setData(await getOrderSummary(date))
      })
    }
  }, [date])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculatePercentageChange = (data: any) => {
    if (!data || !data.monthlySales || data.monthlySales.length < 2)
      return { value: 0, isPositive: true }

    const currentMonth = data.monthlySales[0].value
    const previousMonth = data.monthlySales[1].value

    if (previousMonth === 0) return { value: 100, isPositive: true }

    const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100
    return {
      value: Math.abs(Math.round(percentChange)),
      isPositive: percentChange >= 0,
    }
  }

  if (!data || isPending)
    return (
      <div className='space-y-6 opacity-70 transition-opacity duration-300'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <Skeleton className='h-10 w-52' />
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Card Grid Skeletons */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className='overflow-hidden'>
                <CardHeader className='pb-2'>
                  <Skeleton className='h-5 w-24' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-8 w-32 mb-2' />
                  <Skeleton className='h-4 w-16' />
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Main Chart Skeleton */}
        <Card className='overflow-hidden'>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-[320px] w-full' />
          </CardContent>
        </Card>

        {/* Secondary Charts Skeletons */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className='overflow-hidden'>
                <CardHeader>
                  <Skeleton className='h-6 w-40' />
                  <Skeleton className='h-4 w-28' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-[220px] w-full' />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )

  const percentChange = calculatePercentageChange(data)

  return (
    <div className='space-y-6 transition-opacity duration-300'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {t('Dashboard')}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {t('Analytics and reporting for your business')}
          </p>
        </div>
        <CalendarDateRangePicker defaultDate={date} setDate={setDate} />
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
        <Card className='overflow-hidden transition-all hover:border-primary/40 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between '>
            <CardTitle className='font-extrabold'>
              {t('Total Revenue')}
            </CardTitle>
            <div className='h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center'>
              <BadgeDollarSign className='h-5 w-5 text-primary' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold mb-1'>
              <ProductPrice price={data.totalSales} plain />
            </div>
            <div className='flex items-center text-xs'>
              {percentChange.isPositive ? (
                <div className='flex items-center text-emerald-500'>
                  <ArrowUp className='mr-1 h-3 w-3' />
                  <span>
                    {percentChange.value}% {t('from last month')}
                  </span>
                </div>
              ) : (
                <div className='flex items-center text-rose-500'>
                  <ArrowDown className='mr-1 h-3 w-3' />
                  <span>
                    {percentChange.value}% {t('from last month')}
                  </span>
                </div>
              )}
            </div>

            {/* All Time Revenue */}
            <div className='text-xs text-muted-foreground mt-2'>
              {t('All Time Revenue:')}{' '}
              <ProductPrice price={data.allTimeTotalSales} plain />
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden transition-all hover:border-primary/40 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='font-extrabold'>{t('Sales')}</CardTitle>
            <div className='h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
              <CreditCard className='h-5 w-5 text-blue-700 dark:text-blue-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold mb-1'>
              {formatNumber(data.ordersCount)}
            </div>
            <div className='flex items-center text-xs text-muted-foreground'>
              <span>{t('Total completed orders')}</span>
            </div>

            {/* All Time Orders */}
            <div className='text-xs text-muted-foreground mt-2'>
              {t('All Time Orders:')} {formatNumber(data.allTimeOrdersCount)}
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden transition-all hover:border-primary/40 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between '>
            <CardTitle className='font-extrabold'>{t('Customers')}</CardTitle>
            <div className='h-8 w-8 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center'>
              <Users className='h-5 w-5 text-violet-700 dark:text-violet-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold mb-1'>{data.usersCount}</div>
            <div className='flex items-center text-xs text-muted-foreground'>
              <span>{t('Active user accounts')}</span>
            </div>

            {/* All Time Users */}
            <div className='text-xs text-muted-foreground mt-2'>
              {t('All Time Users:')} {formatNumber(data.allTimeUsersCount)}
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden transition-all hover:border-primary/40 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between '>
            <CardTitle className='font-extrabold'>{t('Products')}</CardTitle>
            <div className='h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center'>
              <Barcode className='h-5 w-5 text-amber-700 dark:text-amber-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold mb-1'>{data.productsCount}</div>
            <div className='flex items-center text-xs text-muted-foreground'>
              <span>{t('Active inventory items')}</span>
            </div>

            {/* All Time Products */}
            <div className='text-xs text-muted-foreground mt-2'>
              {t('All Time Products:')}{' '}
              {formatNumber(data.allTimeProductsCount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview Chart */}
      <div>
        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/40 py-4'>
            <CardTitle>{t('Sales Overview')}</CardTitle>
            <CardDescription>
              {formatDateTime(date!.from!).dateOnly} {t('to')}{' '}
              {formatDateTime(date!.to!).dateOnly}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0 sm:p-6'>
            <div className='h-[350px] w-full pt-4'>
              <SalesAreaChart data={data.salesChartData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Earnings & Product Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/40 py-4'>
            <CardTitle>{t('Monthly Revenue')}</CardTitle>
            <CardDescription>
              {t('Last 6 months earnings breakdown')}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6'>
            <TableChart data={data.monthlySales} labelType='month' />
          </CardContent>
        </Card>

        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/40 py-4'>
            <CardTitle>{t('Product Performance')}</CardTitle>
            <CardDescription>
              {t('Top selling products in selected period')}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6'>
            <TableChart data={data.topSalesProducts} labelType='product' />
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Categories & Orders */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        <Card className='overflow-hidden'>
          <CardHeader className='border-b bg-muted/40 py-4'>
            <CardTitle>{t('Best-Selling Categories')}</CardTitle>
            <CardDescription>
              {formatDateTime(date!.from!).dateOnly} to{' '}
              {formatDateTime(date!.to!).dateOnly}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='h-[350px]'>
              <SalesCategoryPieChart data={data.topSalesCategories} />
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden'>
          <Tabs defaultValue='orders'>
            <CardHeader className='border-b bg-muted/40 py-4'>
              <div className='flex items-center justify-between'>
                <CardTitle>{t('Recent Activity')}</CardTitle>
              </div>
            </CardHeader>

            <TabsContent value='orders' className='m-0 p-0'>
              <div className='max-h-[350px] overflow-auto'>
                <Table>
                  <TableHeader className='sticky top-0 bg-background z-10'>
                    <TableRow>
                      <TableHead className='w-[100px]'>
                        {t('Order ID')}
                      </TableHead>
                      <TableHead>{t('Customer')}</TableHead>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('Total')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead className='text-right'>
                        {t('Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.latestOrders.map((order: IOrderList) => (
                      <TableRow key={order._id} className='hover:bg-muted/60'>
                        <TableCell className='font-mono text-xs'>
                          {order._id.substring(order._id.length - 6)}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {order.user ? order.user.name : t('Deleted User')}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {formatDateTime(order.createdAt).dateOnly}
                        </TableCell>
                        <TableCell>
                          <ProductPrice price={order.totalPrice} plain />
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-xs',
                              order.isDelivered
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : order.isShipped
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                  : order.isPaid
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            )}
                          >
                            {order.isDelivered
                              ? 'Delivered'
                              : order.isShipped
                                ? 'Shipped'
                                : order.isPaid
                                  ? 'Processing'
                                  : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className='text-xs font-medium text-primary hover:underline'
                          >
                            {t('View')}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <CardFooter className='border-t p-3'>
                <Link
                  href='/admin/orders'
                  className='text-xs text-muted-foreground hover:text-primary transition-colors'
                >
                  View all orders
                </Link>
              </CardFooter>
            </TabsContent>

            <TabsContent value='customers' className='m-0'>
              <div className='text-center py-12 text-muted-foreground'>
                <p className='mb-2'>Customer activity will be shown here</p>
                <Link
                  href='/admin/users'
                  className='text-primary text-sm hover:underline'
                >
                  View all customers
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
