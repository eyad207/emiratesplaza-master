import { Metadata } from 'next'
import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getOrdersByUserId } from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'
import ProductPrice from '@/components/shared/product/product-price'
import FilterInput from './FilterInput'

const PAGE_TITLE = 'User Orders'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; orderId?: string }>
}

export default async function UserOrdersPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { page = '1', orderId = '' } = await searchParams
  const orders = await getOrdersByUserId({
    page: Number(page),
    userId: id,
    orderId,
  })
  return (
    <div>
      <div className='flex gap-2'>
        <Link href='/admin/users'>Users</Link>
        <span>›</span>
        <span>{PAGE_TITLE}</span>
      </div>
      <h1 className='h1-bold pt-4'>{PAGE_TITLE}</h1>
      <FilterInput defaultValue={orderId} />
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className=''>
                  No orders found for this user.
                </TableCell>
              </TableRow>
            )}
            {orders.data.map((order: IOrder) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Link href={`/account/orders/${order._id}`}>{order._id}</Link>
                </TableCell>
                <TableCell>
                  {formatDateTime(order.createdAt!).dateTime}
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
                  <Link href={`/admin/orders/${order._id}`}>
                    <span className='px-3 border rounded-full bg-yellow-300 hover:bg-yellow-500 text-black ease-in-out duration-300 height-32 flex items-center justify-center'>
                      Details
                    </span>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <Pagination page={page} totalPages={orders.totalPages} />
        )}
      </div>
    </div>
  )
}
