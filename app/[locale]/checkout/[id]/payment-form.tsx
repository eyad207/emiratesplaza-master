'use client'

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  approvePayPalOrder,
  createPayPalOrder,
  createVippsOrder,
} from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'

import CheckoutFooter from '../checkout-footer'
import { redirect, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'
import StripeForm from './stripe-form'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import useStripePayment from '@/hooks/use-stripe-payment'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
)
export default function OrderDetailsForm({
  order,
  paypalClientId,
}: {
  order: IOrder
  paypalClientId: string
  isAdmin: boolean
}) {
  const t = useTranslations('PaymentForm')
  const {
    setting: { currency },
  } = useSettingStore()
  const { theme } = useTheme()
  const router = useRouter()
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
  } = order
  const { toast } = useToast()

  // Use the Stripe payment hook for client-side payment intent creation
  const {
    clientSecret: stripeClientSecret,
    convertedPrice,
    loading: stripeLoading,
  } = useStripePayment(order._id)

  // Debug logging - remove after fixing
  console.log('Debug Payment Values:', {
    orderTotalPrice: order.totalPrice,
    displayCurrency: currency, // What user sees in UI
    paymentCurrency: 'NOK', // What we actually charge
    convertedPrice,
    calculatedCents: Math.round(order.totalPrice * 100), // Always use order.totalPrice (which is in NOK)
  })

  if (isPaid) {
    redirect(`/account/orders/${order._id}`)
  }
  function PrintLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    let status = ''
    if (isPending) {
      status = t('loadingPayPal')
    } else if (isRejected) {
      status = t('errorLoadingPayPal')
    }
    return status
  }
  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order._id) // Always use NOK for payments
    if (!res.success)
      return toast({
        description: res.message,
        variant: 'destructive',
      })
    return res.data
  }
  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order._id, data)
    const { clearCart } = useCartStore.getState()
    if (res.success) {
      clearCart()
      toast({
        description: res.message,
        variant: res.success ? 'default' : 'destructive',
      })
      router.push(`/account/orders/${order._id}?payment=paypal`)
    }
  }

  const handleCreateVippsOrder = async () => {
    // Always use order.totalPrice which is stored in NOK (base currency)
    const res = await createVippsOrder(order._id, order.totalPrice)
    if (!res.success)
      return toast({
        description: res.message,
        variant: 'destructive',
      })
    window.location.href = res.data.url // Redirect to Vipps payment page
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        <div>
          <div className='text-lg font-bold mb-4'>{t('orderSummary')}</div>
          {/* Price Breakdown */}
          <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  {t('subtotal')}:
                </span>
                <span className='text-gray-900 dark:text-gray-100'>
                  <ProductPrice price={itemsPrice} plain />
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  {t('shippingHandling')}:
                </span>
                <span className='text-gray-900 dark:text-gray-100'>
                  {shippingPrice === undefined ? (
                    '--'
                  ) : shippingPrice === 0 ? (
                    t('free')
                  ) : (
                    <ProductPrice price={shippingPrice} plain />
                  )}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-400'>
                  {t('tax')}:
                </span>
                <span className='text-gray-900 dark:text-gray-100'>
                  {taxPrice === undefined ? (
                    '--'
                  ) : (
                    <ProductPrice price={taxPrice} plain />
                  )}
                </span>
              </div>
              <div className='border-t border-gray-200 dark:border-gray-700 pt-2 mt-2'>
                <div className='flex justify-between text-lg font-bold'>
                  <span className='text-gray-900 dark:text-gray-100'>
                    {t('orderTotal')}:
                  </span>
                  <span className='text-gray-900 dark:text-gray-100'>
                    <ProductPrice price={totalPrice} plain />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className='space-y-4 mt-6'>
            {/* Vipps Payment Method */}
            {!isPaid && (
              <div className='space-y-3'>
                <div className='text-xl'>{t('payWithVipps')}:</div>
                <div className='bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-3'>
                  <Button
                    className='w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors'
                    onClick={handleCreateVippsOrder}
                  >
                    {t('payWithVipps')}
                  </Button>
                  <div className='mt-2 text-xs text-orange-600 dark:text-orange-400 text-center'>
                    {t('secureNorwegianPayment')}
                  </div>
                </div>
              </div>
            )}
            {/* Stripe Payment Method */}
            {!isPaid && (
              <div className='space-y-3'>
                <div className='text-xl'>{t('creditCard')}:</div>
                {stripeLoading ? (
                  <div className='flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600'></div>
                    <span className='ml-2 text-sm text-purple-700 dark:text-purple-300'>
                      {t('loadingPayment')}...
                    </span>
                  </div>
                ) : stripeClientSecret ? (
                  <div className='bg-white dark:bg-gray-800 rounded-lg p-3'>
                    <Elements
                      options={{
                        clientSecret: stripeClientSecret,
                        appearance: {
                          theme: theme === 'dark' ? 'night' : 'stripe',
                          variables: {
                            colorPrimary:
                              theme === 'dark' ? '#a855f7' : '#7c3aed',
                            colorBackground:
                              theme === 'dark' ? '#1f2937' : '#ffffff',
                            colorText: theme === 'dark' ? '#f9fafb' : '#374151',
                            fontFamily: 'system-ui, sans-serif',
                            spacingUnit: '3px',
                            borderRadius: '6px',
                          },
                        },
                      }}
                      stripe={stripePromise}
                    >
                      <StripeForm
                        priceInCents={Math.round(order.totalPrice * 100)} // order.totalPrice is in NOK
                        orderId={order._id}
                      />
                    </Elements>
                    <div className='mt-2 text-xs text-purple-600 dark:text-purple-400 text-center'>
                      {t('secureStripePayment')}
                    </div>
                  </div>
                ) : (
                  <div className='text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg'>
                    <div className='text-red-600 dark:text-red-400 text-sm font-medium'>
                      {t('failedToInitializePayment')}
                    </div>
                    <p className='text-xs text-red-500 dark:text-red-400 mt-1'>
                      {t('refreshAndTryAgain')}
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* PayPal Payment Method */}
            {!isPaid && (
              <div className='space-y-3'>
                <div className='text-xl'>{t('paypalPayment')}:</div>
                <div className='bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
                  <PayPalScriptProvider
                    options={{
                      clientId: paypalClientId,
                      currency: 'NOK', // Always use NOK for payments
                      intent: 'capture',
                      components: 'buttons',
                      'enable-funding': 'venmo,paylater,card',
                      'disable-funding': '',
                    }}
                  >
                    <PrintLoadingState />
                    <PayPalButtons
                      style={{
                        layout: 'horizontal',
                        color: theme === 'dark' ? 'white' : 'gold',
                        shape: 'rect',
                        label: 'paypal',
                        height: 40,
                        tagline: false,
                      }}
                      fundingSource={undefined} // Allow all funding sources
                      createOrder={handleCreatePayPalOrder}
                      onApprove={handleApprovePayPalOrder}
                      onError={() => {
                        toast({
                          description: t('paypalPaymentFailed'),
                          variant: 'destructive',
                        })
                      }}
                      onCancel={() => {
                        toast({
                          description: t('paypalPaymentCancelled'),
                          variant: 'default',
                        })
                      }}
                    />
                  </PayPalScriptProvider>
                  <div className='mt-2 text-xs text-blue-600 dark:text-blue-400 text-center'>
                    {t('protectedByPayPal')}
                  </div>
                </div>
              </div>
            )}

            {!isPaid && paymentMethod === 'Cash On Delivery' && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {t('cashOnDelivery')}
                </h4>
                <div className='bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg p-3'>
                  <Button
                    className='w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
                    onClick={() => router.push(`/account/orders/${order._id}`)}
                  >
                    {t('viewOrderDetails')}
                  </Button>
                  <div className='mt-2 text-xs text-green-600 dark:text-green-400 text-center'>
                    {t('payWhenDelivered')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className='max-w-6xl mx-auto px-4 md:px-6'>
      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-20'>
        <div className='md:col-span-2 lg:col-span-2'>
          {/* Shipping Address */}
          <div>
            <div className='grid grid-cols-1 md:grid-cols-5 lg:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold md:col-span-2 lg:col-span-1'>
                <span>{t('shippingAddress')}</span>
              </div>
              <div className='md:col-span-3 lg:col-span-2'>
                <p>
                  {shippingAddress.fullName} <br />
                  {shippingAddress.street} <br />
                  {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                </p>
              </div>
            </div>
          </div>

          {/* payment method */}
          <div className='border-y'>
            <div className='grid grid-cols-1 md:grid-cols-5 lg:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold md:col-span-2 lg:col-span-1'>
                <span>{t('paymentMethod')}</span>
              </div>
              <div className='md:col-span-3 lg:col-span-2'>
                <p>{paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className='grid md:grid-cols-3 my-3 pb-3'>
            <div className='flex text-lg font-bold'>
              <span>{t('itemsAndShipping')}</span>
            </div>
            <div className='col-span-2'>
              <p className='mb-4 text-gray-600 dark:text-gray-400'>
                {t('deliveryDate')}:{' '}
                {formatDateTime(expectedDeliveryDate).dateOnly}
              </p>
              <div className='space-y-3'>
                {items.map((item) => (
                  <div
                    key={item.slug}
                    className='flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                  >
                    {/* Product Image */}
                    <div className='flex-shrink-0'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className='rounded-md object-cover border border-gray-200 dark:border-gray-600'
                      />
                    </div>

                    {/* Product Details */}
                    <div className='flex-1'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h6 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {item.name}
                          </h6>
                          <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1'>
                            <span>
                              {t('qty')}: {item.quantity}
                            </span>
                            {item.color && (
                              <span className='flex items-center'>
                                <span
                                  className='w-2 h-2 rounded-full border border-gray-300 mr-1'
                                  style={{
                                    backgroundColor: item.color.toLowerCase(),
                                  }}
                                />
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span>
                                {t('size')}: {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                          <ProductPrice
                            price={item.price}
                            discountedPrice={item.discountedPrice}
                            plain
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className='block md:hidden'>
            <CheckoutSummary />
          </div>
          <div className='hidden md:block lg:hidden'>
            <CheckoutSummary />
          </div>
          <CheckoutFooter />
        </div>
        <div className='hidden lg:block w-max'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
