'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IOrder } from '@/lib/db/models/order.model'
import { cn, formatDateTime } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import ProductPrice from '../product/product-price'
import ActionButton from '../action-button'
import {
  deliverOrder,
  shipOrder,
  updateOrderToPaid,
  updateOrderAdminNotes,
} from '@/lib/actions/order.actions'
import { useTranslations } from 'next-intl'

export default function OrderDetailsForm({
  order,
  isAdmin,
}: {
  order: IOrder
  isAdmin: boolean
}) {
  const t = useTranslations()
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    paymentResult,
    isPaid,
    paidAt,
    isDelivered: initialIsDelivered,
  } = order

  const [isPending, startTransition] = useTransition()
  const [isDelivered, setIsDelivered] = useState(initialIsDelivered)
  const [isShipped, setIsShipped] = useState(order.isShipped || false)
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '')
  const [isNotePending, setIsNotePending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Function to determine the actual payment method used
  const getActualPaymentMethod = () => {
    // Special handling for Free Orders first
    if (paymentMethod === 'Free Order' || totalPrice === 0) {
      return 'Free Order'
    }

    if (!isPaid || !paymentResult) {
      return paymentMethod // Return the selected method if not paid yet
    }

    // Check for free order payment result
    if (paymentResult.id === 'FREE_ORDER') {
      return 'Free Order'
    }

    // For paid orders, determine the actual payment method from paymentResult
    if (paymentResult.id) {
      const paymentId = paymentResult.id.toLowerCase()

      // Check if it's a Stripe payment
      // Stripe IDs: pi_ (payment intent), ch_ (charge), evt_ (event), cs_ (checkout session)
      if (
        paymentId.startsWith('pi_') ||
        paymentId.startsWith('evt_') ||
        paymentId.startsWith('ch_') ||
        paymentId.startsWith('cs_')
      ) {
        return 'Stripe'
      }

      // Check if it's a PayPal payment
      // PayPal typically has longer alphanumeric IDs, often contains 'PAY-' or has specific patterns
      if (
        paymentId.includes('pay-') ||
        (paymentResult.id.length >= 17 &&
          /^[A-Z0-9]{17,}$/i.test(paymentResult.id))
      ) {
        return 'PayPal'
      }

      // Check if it's a Vipps payment (adjust based on actual Vipps ID format)
      if (paymentId.includes('vipps') || paymentMethod === 'Vipps') {
        return 'Vipps'
      }
    }

    // Special handling for Cash on Delivery
    if (paymentMethod === 'Cash On Delivery') {
      return 'Cash On Delivery'
    }

    // If we can't determine from payment result, fall back to selected method
    return paymentMethod
  }

  const actualPaymentMethod = getActualPaymentMethod()

  const handleDeliveryStatusChange = async () => {
    startTransition(async () => {
      const res = await deliverOrder(order._id)
      if (res.success) {
        setIsDelivered(!isDelivered)
        toast({
          description: res.message,
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      }
    })
  }

  const handleShippingStatusChange = async () => {
    startTransition(async () => {
      const res = await shipOrder(order._id)
      if (res.success) {
        setIsShipped(!isShipped)
        toast({
          description: res.message,
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      }
    })
  }

  const handleSaveAdminNotes = async () => {
    setIsNotePending(true)
    try {
      const res = await updateOrderAdminNotes(order._id, adminNotes)
      if (res.success) {
        toast({
          description: res.message,
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      }
    } finally {
      setIsNotePending(false)
    }
  }

  return (
    <div className='grid md:grid-cols-3 md:gap-6'>
      <div className='overflow-x-auto md:col-span-2 space-y-6'>
        {/* Shipping Address Card */}
        <Card className='shadow-sm'>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold border-b border-border pb-3 mb-4'>
              {t('Orders.ShippingAddress')}
            </h2>
            <div className='space-y-3'>
              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3'>
                <p className='text-green-800 dark:text-green-200 font-medium text-sm flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {t('Orders.ReceiptSent')}
                </p>
                {typeof order.user === 'object' && order.user?.email && (
                  <p className='text-green-700 dark:text-green-300 text-sm mt-2 ml-6'>
                    {order.user.email}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <div className='flex items-start gap-3'>
                  <svg
                    className='w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                  <div>
                    <p className='font-semibold'>{shippingAddress.fullName}</p>
                    <p className='text-muted-foreground text-sm'>
                      {shippingAddress.phone}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <svg
                    className='w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                  <div className='text-sm leading-relaxed'>
                    <p>{shippingAddress.street}</p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.province}
                    </p>
                    <p>
                      {shippingAddress.postalCode}, {shippingAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card className='shadow-sm'>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold border-b border-border pb-3 mb-4'>
              {t('Orders.PaymentMethod')}
            </h2>
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
                  {actualPaymentMethod === 'Stripe' && (
                    <svg
                      className='w-6 h-6 text-primary'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z' />
                    </svg>
                  )}
                  {actualPaymentMethod === 'PayPal' && (
                    <svg
                      className='w-6 h-6 text-primary'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.028-.026.056-.052.08-.306 1.554-.776 2.953-1.52 4.129-.744 1.176-1.756 2.117-3.036 2.824-.42.232-.88.42-1.38.56l-.428 2.717-.72 4.581a.641.641 0 0 1-.633.54H9.23c-.524 0-.968-.382-1.05-.9L7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81.494.563.86 1.193 1.074 1.907z' />
                    </svg>
                  )}
                  {actualPaymentMethod === 'Vipps' && (
                    <svg
                      className='w-6 h-6 text-primary'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1.5-4L7 17H5.5l2.5-6h1.8l1.7 4 1.7-4h1.8l2.5 6H16l-1.5-4L13 17h-1l-1-2.5L10 17H9z' />
                    </svg>
                  )}
                  {actualPaymentMethod === 'Cash On Delivery' && (
                    <svg
                      className='w-6 h-6 text-primary'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                      />
                    </svg>
                  )}
                  {/* Default icon for other payment methods */}
                  {!['Stripe', 'PayPal', 'Vipps', 'Cash On Delivery'].includes(
                    actualPaymentMethod
                  ) && (
                    <svg
                      className='w-6 h-6 text-primary'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className='font-semibold'>{actualPaymentMethod}</p>
                  <p className='text-sm text-muted-foreground'>
                    {isPaid && paymentResult
                      ? t('Orders.ActualPaymentMethod')
                      : t('Orders.PaymentMethodLabel')}
                  </p>
                </div>
              </div>

              <div>
                {isPaid ? (
                  <div className='space-y-2'>
                    <Badge className='bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'>
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                      {t('Orders.PaidAt', {
                        date: formatDateTime(paidAt!).dateTime,
                      })}
                    </Badge>
                    {/* Show if payment method differs from selection */}
                    {isAdmin && actualPaymentMethod !== paymentMethod && (
                      <p className='text-xs text-muted-foreground'>
                        {t('Orders.SelectedMethod')}: {paymentMethod}
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge
                    variant='destructive'
                    className='bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                  >
                    <svg
                      className='w-4 h-4 mr-1'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {t('Orders.NotPaid')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>{t('Orders.OrderItems')}</h2>

            {/* Mobile Layout - Card-based */}
            <div className='block md:hidden space-y-4'>
              {items.map((item, index) => (
                <Card
                  key={`${item.slug}-${index}`}
                  className='border border-border/50'
                >
                  <CardContent className='p-4'>
                    <div className='flex gap-4'>
                      {/* Product Image */}
                      <div className='flex-shrink-0'>
                        <Link href={`/product/${item.slug}`}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className='rounded-lg object-cover border'
                          />
                        </Link>
                      </div>

                      {/* Product Details */}
                      <div className='flex-1 min-w-0'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='block hover:text-primary transition-colors'
                        >
                          <h3 className='font-semibold text-base leading-tight mb-2 break-words'>
                            {item.name}
                          </h3>
                        </Link>

                        {/* Product Attributes */}
                        <div className='space-y-1 text-sm text-muted-foreground mb-3'>
                          {item.color && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {t('Orders.Color')}:
                              </span>
                              <div className='flex items-center gap-1'>
                                <div
                                  className='w-4 h-4 rounded-full border border-border'
                                  style={{
                                    backgroundColor: item.color.toLowerCase(),
                                  }}
                                />
                                <span>{item.color}</span>
                              </div>
                            </div>
                          )}
                          {item.size && (
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {t('Orders.Size')}:
                              </span>
                              <Badge variant='outline' className='text-xs'>
                                {item.size}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Quantity and Price */}
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>
                              {t('Orders.Quantity')}:
                            </span>
                            <Badge
                              variant='secondary'
                              className='font-semibold'
                            >
                              {item.quantity}
                            </Badge>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-bold'>
                              <ProductPrice
                                price={itemsPrice / item.quantity}
                                plain
                              />{' '}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Layout - Table */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow className='border-b border-border'>
                    <TableHead className='w-[40%] font-semibold'>
                      {t('Orders.Item')}
                    </TableHead>
                    <TableHead className='text-center font-semibold'>
                      {t('Orders.Quantity')}
                    </TableHead>
                    <TableHead className='text-center font-semibold'>
                      {t('Orders.Color')}
                    </TableHead>
                    <TableHead className='text-center font-semibold'>
                      {t('Orders.Size')}
                    </TableHead>
                    <TableHead className='text-right font-semibold'>
                      {t('Orders.Price')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={`${item.slug}-${index}`}
                      className='border-b border-border/50 hover:bg-muted/30 transition-colors'
                    >
                      <TableCell className='py-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='flex items-center gap-3 hover:text-primary transition-colors group'
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={60}
                            height={60}
                            className='rounded-lg object-cover border group-hover:border-primary/50 transition-colors'
                          />
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-medium leading-tight break-words'>
                              {item.name}
                            </h3>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className='text-center py-4'>
                        <Badge variant='secondary' className='font-semibold'>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center py-4'>
                        {item.color ? (
                          <div className='flex items-center justify-center gap-2'>
                            <div
                              className='w-4 h-4 rounded-full border border-border'
                              style={{
                                backgroundColor: item.color.toLowerCase(),
                              }}
                            />
                            <span className='text-sm'>{item.color}</span>
                          </div>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            {t('Orders.None')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-center py-4'>
                        {item.size ? (
                          <Badge variant='outline' className='text-xs'>
                            {item.size}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            {t('Orders.None')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-right py-4'>
                        <div className='space-y-1'>
                          <div className='font-semibold'>
                            <ProductPrice
                              price={itemsPrice / item.quantity}
                              plain
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className='space-y-4'>
        <Card className='shadow-sm'>
          <CardContent className='p-6 space-y-6'>
            <h2 className='text-xl font-semibold border-b border-border pb-3'>
              {t('Orders.OrderSummary')}
            </h2>

            <div className='space-y-4'>
              <div className='flex justify-between items-center py-2 border-b border-border/30'>
                <span className='text-muted-foreground'>
                  {t('Orders.Items')}
                </span>
                <span className='font-medium'>
                  <ProductPrice price={itemsPrice} plain />
                </span>
              </div>

              <div className='flex justify-between items-center py-2 border-b border-border/30'>
                <span className='text-muted-foreground'>{t('Orders.Tax')}</span>
                <span className='font-medium'>
                  <ProductPrice price={taxPrice} plain />
                </span>
              </div>

              <div className='flex justify-between items-center py-2 border-b border-border/30'>
                <span className='text-muted-foreground'>
                  {t('Orders.Shipping')}
                </span>
                <span className='font-medium'>
                  <ProductPrice price={shippingPrice} plain />
                </span>
              </div>

              <div className='flex justify-between items-center py-3 border-t-2 border-primary/20 bg-muted/30 -mx-6 px-6 rounded-lg'>
                <span className='text-lg font-semibold'>
                  {t('Orders.Total')}
                </span>
                <span className='text-lg font-bold text-primary'>
                  <ProductPrice price={totalPrice} plain />
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3 pt-4'>
              {!isPaid && ['Stripe', 'PayPal'].includes(paymentMethod) && (
                <Link
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
                  href={`/checkout/${order._id}`}
                >
                  {t('Orders.PayOrder')}
                </Link>
              )}

              {isAdmin && !isPaid && paymentMethod === 'Cash On Delivery' && (
                <ActionButton
                  caption={t('Orders.MarkAsPaid')}
                  action={() => updateOrderToPaid(order._id)}
                />
              )}

              {isAdmin && isPaid && (
                <div className='flex flex-col sm:flex-row gap-2'>
                  <Button
                    className='flex-1'
                    onClick={handleShippingStatusChange}
                    disabled={isPending}
                    variant={isShipped ? 'outline' : 'default'}
                    size='sm'
                  >
                    {isShipped
                      ? t('Orders.UnmarkAsShipped')
                      : t('Orders.MarkAsShipped')}
                  </Button>

                  <Button
                    className='flex-1'
                    onClick={handleDeliveryStatusChange}
                    disabled={isPending}
                    variant={isDelivered ? 'outline' : 'default'}
                    size='sm'
                  >
                    {isDelivered
                      ? t('Orders.UnmarkAsDelivered')
                      : t('Orders.MarkAsDelivered')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        {isAdmin && (
          <Card className='shadow-sm'>
            <CardContent className='p-6 space-y-4'>
              <h3 className='text-lg font-semibold border-b border-border pb-3'>
                Admin Notepad
              </h3>
              <textarea
                className='w-full h-32 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
                placeholder='Write internal notes about this order...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <Button
                disabled={isNotePending}
                size='sm'
                className='w-full sm:w-auto'
                onClick={handleSaveAdminNotes}
              >
                {isNotePending ? 'Saving...' : 'Save Note'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
