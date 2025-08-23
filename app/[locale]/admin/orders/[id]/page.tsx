import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById, markOrderAsViewed } from '@/lib/actions/order.actions' // import the function!
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import Link from 'next/link'

export const metadata = {
  title: 'Admin Order Details',
}

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  await markOrderAsViewed(id)

  const order = await getOrderById(id)
  if (!order || (!order.isPaid && order.paymentMethod !== 'Cash On Delivery')) {
    notFound()
  }

  const session = await auth()

  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/orders'>Orders</Link> <span className='mx-1'>›</span>
        <Link href={`/admin/orders/${order._id}`}>{order._id}</Link>
      </div>
      <OrderDetailsForm
        order={order}
        isAdmin={session?.user?.role === 'Admin' || false}
      />
    </main>
  )
}

export default AdminOrderDetailsPage
