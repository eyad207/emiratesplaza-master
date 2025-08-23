import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteAllOrders,
  deleteOrder,
  getAllOrders,
} from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'
import FilterInput from './FilterInput'

export const metadata: Metadata = {
  title: 'Admin Orders',
}

export default async function OrdersPage(props: {
  searchParams: Promise<{
    page?: string
    orderId?: string
    sort?: string
    order?: string
  }>
}) {
  const searchParams = await props.searchParams

  const {
    page = '1',
    orderId = '',
    sort = 'createdAt',
    order = 'desc',
  } = searchParams

  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')

  const orders = await getAllOrders({
    page: Number(page),
    orderId,
    sort,
    order,
  })

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between mb-2'>
        <h1 className='h1-bold'>Orders</h1>
        <form action={deleteAllOrders}>
          <Button variant='destructive' type='submit'>
            Delete All Orders
          </Button>
        </form>
      </div>
      <FilterInput defaultValue={orderId} />
      <div className='overflow-x-auto'>
        {orders.data.length === 0 ? (
          <p>No orders found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Link
                    href={{
                      pathname: '/admin/orders',
                      query: {
                        page,
                        orderId,
                        sort: '_id',
                        order:
                          sort === '_id' && order === 'asc' ? 'desc' : 'asc',
                      },
                    }}
                    className='cursor-pointer hover:underline'
                  >
                    Id {sort === '_id' && (order === 'asc' ? '↑' : '↓')}
                  </Link>
                </TableHead>
                <TableHead>
                  <Link
                    href={{
                      pathname: '/admin/orders',
                      query: {
                        page,
                        orderId,
                        sort: 'createdAt',
                        order:
                          sort === 'createdAt' && order === 'asc'
                            ? 'desc'
                            : 'asc',
                      },
                    }}
                    className='cursor-pointer hover:underline'
                  >
                    Date {sort === 'createdAt' && (order === 'asc' ? '↑' : '↓')}
                  </Link>
                </TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>
                  <Link
                    href={{
                      pathname: '/admin/orders',
                      query: {
                        page,
                        orderId,
                        sort: 'totalPrice',
                        order:
                          sort === 'totalPrice' && order === 'asc'
                            ? 'desc'
                            : 'asc',
                      },
                    }}
                    className='cursor-pointer hover:underline'
                  >
                    Total{' '}
                    {sort === 'totalPrice' && (order === 'asc' ? '↑' : '↓')}
                  </Link>
                </TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>
                  <Link
                    href={{
                      pathname: '/admin/orders',
                      query: {
                        page,
                        orderId,
                        sort: 'viewed',
                        order:
                          sort === 'viewed' && order === 'asc' ? 'desc' : 'asc',
                      },
                    }}
                    className='cursor-pointer hover:underline'
                  >
                    Status {sort === 'viewed' && (order === 'asc' ? '↑' : '↓')}
                  </Link>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order: IOrderList) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  <TableCell>
                    {formatDateTime(order.createdAt!).dateTime}
                  </TableCell>
                  <TableCell>
                    {order.user ? order.user.name : 'Deleted User'}
                  </TableCell>
                  <TableCell>
                    <ProductPrice price={order.totalPrice} plain />
                  </TableCell>
                  <TableCell>
                    {order.isPaid && order.paidAt
                      ? formatDateTime(order.paidAt).dateTime
                      : 'No'}
                  </TableCell>
                  <TableCell>
                    {order.isDelivered && order.deliveredAt
                      ? formatDateTime(order.deliveredAt).dateTime
                      : 'No'}
                  </TableCell>
                  <TableCell>
                    {order.viewed ? (
                      <span className='text-green-600 font-semibold'>
                        Viewed
                      </span>
                    ) : (
                      <span className='text-red-600 font-semibold'>New!</span>
                    )}
                  </TableCell>
                  <TableCell className='flex gap-1'>
                    <Button asChild variant='outline' size='sm'>
                      <Link href={`/admin/orders/${order._id}`}>Details</Link>
                    </Button>
                    <DeleteDialog id={order._id} action={deleteOrder} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages!} />
        )}
      </div>
    </div>
  )
}
