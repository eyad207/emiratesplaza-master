'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createOrder } from '@/lib/actions/order.actions'
import {
  calculateFutureDate,
  formatDateTime,
  timeUntilMidnight,
} from '@/lib/utils'
import { ShippingAddressSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { TrashIcon } from 'lucide-react'
import CheckoutFooter from './checkout-footer'
import { ShippingAddress } from '@/types'
import useIsMounted from '@/hooks/use-is-mounted'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import ProductPrice from '@/components/shared/product/product-price'
import { useTranslations } from 'next-intl'
import {
  validateCartClientSide,
  hasInvalidQuantities,
  getInvalidQuantityItems,
} from '@/lib/cart-validation-client'

const shippingAddressDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        fullName: 'Basir',
        street: '1911, 65 Sherbrooke Est',
        city: 'Montreal',
        province: 'Quebec',
        phone: '4181234567',
        postalCode: 'H2X 1C4',
        country: 'Canada',
      }
    : {
        fullName: '',
        street: '',
        city: '',
        province: '',
        phone: '',
        postalCode: '',
        country: '',
      }

const CheckoutForm = () => {
  const t = useTranslations('Checkout')
  const tCart = useTranslations('Cart')
  const { toast } = useToast()
  const router = useRouter()
  const {
    setting: { defaultPaymentMethod, availableDeliveryDates },
  } = useSettingStore()

  const {
    cart: {
      items,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      shippingAddress,
      deliveryDateIndex,
      paymentMethod = defaultPaymentMethod,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    setDeliveryDateIndex,
    refreshCartStock,
    clearCart,
  } = useCartStore()
  const isMounted = useIsMounted()

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  })
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    setShippingAddress(values)
    setIsAddressSelected(true)
  }

  useEffect(() => {
    if (!isMounted || !shippingAddress) return
    shippingAddressForm.setValue('fullName', shippingAddress.fullName)
    shippingAddressForm.setValue('street', shippingAddress.street)
    shippingAddressForm.setValue('city', shippingAddress.city)
    shippingAddressForm.setValue('country', shippingAddress.country)
    shippingAddressForm.setValue('postalCode', shippingAddress.postalCode)
    shippingAddressForm.setValue('province', shippingAddress.province)
    shippingAddressForm.setValue('phone', shippingAddress.phone)
  }, [items, isMounted, router, shippingAddress, shippingAddressForm])

  useEffect(() => {
    refreshCartStock()
  }, [refreshCartStock])

  // Early validation - redirect if cart is invalid
  useEffect(() => {
    if (!isMounted) return

    if (items.length === 0) {
      toast({
        description: tCart('Your cart is empty'),
        variant: 'destructive',
      })
      return
    }

    // Check if any items have invalid quantities
    if (hasInvalidQuantities(items)) {
      toast({
        description: tCart('Please fix invalid quantities before checkout'),
        variant: 'destructive',
      })
      router.push('/cart?error=invalid-quantities')
      return
    }
  }, [items, isMounted, router, tCart, toast])

  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false)
  const [isItemsSelected, setIsItemsSelected] = useState<boolean>(false)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false)

  const handlePlaceOrder = async () => {
    // If total price is 0, automatically mark as paid and skip payment
    const isFreeOrder = totalPrice === 0

    // Map UI payment choices to stored order payment method
    const mappedPaymentMethod = isFreeOrder
      ? 'Free Order'
      : paymentMethod === 'Cash On Delivery'
        ? 'Cash On Delivery'
        : 'Stripe'

    // Comprehensive cart validation
    const cartValidation = validateCartClientSide({
      items,
      itemsPrice,
      totalPrice,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
    })

    // Check for invalid quantities
    const invalidQuantityItems = getInvalidQuantityItems(items)

    if (!cartValidation.isValid || invalidQuantityItems.length > 0) {
      const errorMessages = [
        ...cartValidation.errors,
        ...invalidQuantityItems.map(
          (item) => `${item.name}: Invalid quantity (${item.quantity})`
        ),
      ]

      toast({
        description:
          errorMessages.length > 0
            ? errorMessages.join('; ')
            : t('Please fix cart issues before placing your order'),
        variant: 'destructive',
      })
      return
    }

    // Check required fields
    if (!shippingAddress) {
      toast({
        description: t('Shipping address is required'),
        variant: 'destructive',
      })
      return
    }

    if (!paymentMethod) {
      toast({
        description: t('Payment method is required'),
        variant: 'destructive',
      })
      return
    }

    if (deliveryDateIndex === undefined) {
      toast({
        description: t('Delivery date is required'),
        variant: 'destructive',
      })
      return
    }

    const res = await createOrder({
      items,
      shippingAddress,
      expectedDeliveryDate: calculateFutureDate(
        availableDeliveryDates[deliveryDateIndex!].daysToDeliver
      ),
      deliveryDateIndex,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    })
    if (!res.success) {
      toast({
        description: res.message,
        variant: 'destructive',
      })
    } else {
      toast({
        description: res.message,
        variant: 'default',
      })

      // For free orders or cash on delivery, go to order page
      if (isFreeOrder || mappedPaymentMethod === 'Cash On Delivery') {
        clearCart() // Clear cart for free orders and cash on delivery
        router.push(`/account/orders/${res.data?.orderId}`)
      } else {
        router.push(`/checkout/${res.data?.orderId}`)
      }
    }
  }
  const handleSelectPaymentMethod = async () => {
    // Validate cart before proceeding to payment
    const invalidQuantityItems = getInvalidQuantityItems(items)

    if (hasInvalidQuantities(items) || invalidQuantityItems.length > 0) {
      toast({
        description: t(
          'Please fix invalid quantities before proceeding to payment'
        ),
        variant: 'destructive',
      })
      return
    }

    // Just set the payment method as selected
    setIsAddressSelected(true)
    setIsItemsSelected(true)
    setIsPaymentMethodSelected(true)
  }
  const handleSelectItemsAndShipping = () => {
    // Validate cart before proceeding to next step
    const invalidQuantityItems = getInvalidQuantityItems(items)

    if (hasInvalidQuantities(items) || invalidQuantityItems.length > 0) {
      toast({
        description: t('Please fix invalid quantities before proceeding'),
        variant: 'destructive',
      })
      return
    }

    setIsAddressSelected(true)
    setIsItemsSelected(true)
  }
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)()
  }
  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        {!isAddressSelected && (
          <div className='border-b mb-4'>
            <Button
              className='rounded-full w-full'
              onClick={handleSelectShippingAddress}
            >
              {t('shipToThisAddress')}
            </Button>
            <p className='text-xs text-center py-2'>
              {t('chooseShippingAddressFirst')}
            </p>
          </div>
        )}
        {isAddressSelected && !isItemsSelected && (
          <div className=' mb-4'>
            <Button
              className='rounded-full w-full'
              onClick={handleSelectItemsAndShipping}
              disabled={items.some((it) => it.quantity === 0)}
            >
              {t('continueToItems')}
            </Button>
            <p className='text-xs text-center py-2'>
              {t('reviewItemsAndShipping')}
            </p>
          </div>
        )}
        {isItemsSelected && isAddressSelected && !isPaymentMethodSelected && (
          <div>
            <Button
              onClick={handleSelectPaymentMethod}
              className='rounded-full w-full'
              disabled={items.some((it) => it.quantity === 0)}
            >
              {totalPrice === 0
                ? t('placeYourOrder')
                : paymentMethod === 'Cash On Delivery'
                  ? t('placeYourOrder')
                  : t('useThisPaymentMethod')}
            </Button>
            <p className='text-xs text-center py-2'></p>
          </div>
        )}
        {isPaymentMethodSelected && isAddressSelected && isItemsSelected && (
          <div>
            <Button
              onClick={handlePlaceOrder}
              className='rounded-full w-full'
              disabled={items.some((it) => it.quantity === 0)}
            >
              {t('placeYourOrder')}
            </Button>
          </div>
        )}

        <div>
          <div className='text-lg font-bold'>{t('orderSummary')}</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>{t('items')}:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className='flex justify-between'>
              <span>{t('shippingHandling')}:</span>
              <span>
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  t('free')
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>{t('tax')}:</span>
              <span>
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between  pt-4 font-bold text-lg'>
              <span>{t('orderTotal')}:</span>
              <span>
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className='max-w-6xl mx-auto px-4 md:px-6 highlight-link'>
      <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
        <div className='md:col-span-2 lg:col-span-3'>
          {/* shipping address */}
          <div>
            {isAddressSelected && shippingAddress ? (
              <div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 my-3 pb-3'>
                <div className='col-span-4 md:col-span-3 lg:col-span-5 flex text-lg font-bold'>
                  <span className='w-8'>1 </span>
                  <span>{t('shippingAddress')}</span>
                </div>
                <div className='col-span-4 md:col-span-3 lg:col-span-5'>
                  <p>
                    {shippingAddress.fullName} <br />
                    {shippingAddress.street} <br />
                    {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                  </p>
                </div>
                <div className='col-span-2'>
                  <Button
                    onClick={() => {
                      setIsAddressSelected(false)
                      setIsItemsSelected(false)
                      setIsPaymentMethodSelected(false)
                    }}
                    className='w-full md:w-auto'
                  >
                    {t('change')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className='flex text-primary text-lg font-bold my-2'>
                  <span className='w-8'>1 </span>
                  <span>{t('enterShippingAddress')}</span>
                </div>
                <Form {...shippingAddressForm}>
                  <form
                    method='post'
                    onSubmit={shippingAddressForm.handleSubmit(
                      onSubmitShippingAddress
                    )}
                    className='space-y-4'
                  >
                    <Card className='md:ml-8 my-4'>
                      <CardContent className='p-4 space-y-2'>
                        <div className='text-lg font-bold mb-2'>
                          {t('yourAddress')}
                        </div>

                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='fullName'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('fullName')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterFullName')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={shippingAddressForm.control}
                            name='street'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('address')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterAddress')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='city'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('city')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterCity')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name='province'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('province')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterProvince')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name='country'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('country')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterCountry')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='postalCode'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('postalCode')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterPostalCode')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>{t('phoneNumber')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('enterPhoneNumber')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className='  p-4'>
                        <Button
                          type='submit'
                          className='rounded-full font-bold'
                        >
                          {t('shipToThisAddress')}
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            )}
          </div>
          {/* items and delivery date */}
          <div className='border-y'>
            {isItemsSelected && deliveryDateIndex != undefined ? (
              <div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 my-3 pb-3'>
                <div className='flex text-lg font-bold col-span-4 md:col-span-3 lg:col-span-5'>
                  <span className='w-8'>2 </span>
                  <span>{t('itemsAndShipping')}</span>
                </div>
                <div className='col-span-4 md:col-span-3 lg:col-span-5'>
                  <p>
                    {t('deliveryDate')}:{' '}
                    {
                      formatDateTime(
                        calculateFutureDate(
                          availableDeliveryDates[deliveryDateIndex]
                            .daysToDeliver
                        )
                      ).dateOnly
                    }
                  </p>
                  {/* Product List */}
                  <div className='space-y-3 mb-4'>
                    {items.map((item, index) => (
                      <div
                        key={`${item.slug}-${index}`}
                        className='flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                      >
                        {/* Product Image */}
                        <div className='flex-shrink-0'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
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
                                <span>Qty: {item.quantity}</span>
                                {item.color && (
                                  <span className='flex items-center'>
                                    <span
                                      className='w-2 h-2 rounded-full border border-gray-300 mr-1'
                                      style={{
                                        backgroundColor:
                                          item.color.toLowerCase(),
                                      }}
                                    />
                                    {item.color}
                                  </span>
                                )}
                                {item.size && <span>Size: {item.size}</span>}
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
                <div className='col-span-2'>
                  <Button
                    onClick={() => {
                      setIsItemsSelected(false)
                      setIsPaymentMethodSelected(false)
                    }}
                  >
                    {t('change')}
                  </Button>
                </div>
              </div>
            ) : isAddressSelected ? (
              <>
                <div className='flex text-primary  text-lg font-bold my-2'>
                  <span className='w-8'>2 </span>
                  <span>{t('reviewItemsAndShipping')}</span>
                </div>
                <Card className='md:ml-8'>
                  <CardContent className='p-4'>
                    <p className='mb-2'>
                      <span className='text-lg font-bold text-green-700'>
                        {t('arriving')}{' '}
                        {
                          formatDateTime(
                            calculateFutureDate(
                              availableDeliveryDates[deliveryDateIndex!]
                                .daysToDeliver
                            )
                          ).dateOnly
                        }
                      </span>{' '}
                      {t('orderInNext', {
                        hours: timeUntilMidnight().hours,
                        minutes: timeUntilMidnight().minutes,
                      })}
                    </p>
                    <div className='grid md:grid-cols-2 gap-6'>
                      <div>
                        {items.map((item, index) => (
                          <div
                            key={`${item.slug}-${index}`}
                            className='flex gap-4 py-2'
                          >
                            <div className='relative w-16 h-16'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes='20vw'
                                style={{
                                  objectFit: 'contain',
                                }}
                              />
                            </div>

                            <div className='flex-1'>
                              <p className='font-semibold'>
                                {item.name}, {item.color}, {item.size}
                              </p>
                              <p className='font-bold'>
                                <ProductPrice
                                  price={item.price}
                                  discountedPrice={item.discountedPrice}
                                  plain
                                />
                              </p>

                              <div className='flex items-center gap-2 mt-2'>
                                <Select
                                  value={item.quantity.toString()}
                                  onValueChange={(value) => {
                                    const newQuantity = Number(value)
                                    if (newQuantity === 0) {
                                      removeItem(item) // Remove the item if quantity is 0
                                    } else {
                                      updateItem(item, newQuantity)
                                    }
                                  }}
                                >
                                  <SelectTrigger className='w-24'>
                                    <SelectValue>
                                      {t('qty', { quantity: item.quantity })}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent position='popper'>
                                    {Array.from({
                                      length:
                                        item.colors
                                          .find((c) => c.color === item.color)
                                          ?.sizes.find(
                                            (s) => s.size === item.size
                                          )?.countInStock || 0,
                                    }).map((_, i) => (
                                      <SelectItem
                                        key={i + 1}
                                        value={`${i + 1}`}
                                      >
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value='0'>
                                      {t('delete')}
                                    </SelectItem>{' '}
                                    {/* Add an option to remove */}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive'
                                  onClick={() => removeItem(item)}
                                  title={'0'}
                                >
                                  <TrashIcon className='w-4 h-4' />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className=' font-bold'>
                          <p className='mb-2'>{t('chooseShippingSpeed')}:</p>

                          <ul>
                            <RadioGroup
                              value={
                                availableDeliveryDates[deliveryDateIndex!].name
                              }
                              onValueChange={(value) =>
                                setDeliveryDateIndex(
                                  availableDeliveryDates.findIndex(
                                    (address) => address.name === value
                                  )!
                                )
                              }
                            >
                              {availableDeliveryDates.map((dd) => (
                                <div key={dd.name} className='flex'>
                                  <RadioGroupItem
                                    value={dd.name}
                                    id={`address-${dd.name}`}
                                  />
                                  <Label
                                    className='pl-2 space-y-2 cursor-pointer'
                                    htmlFor={`address-${dd.name}`}
                                  >
                                    <div className='text-green-700 font-semibold'>
                                      {
                                        formatDateTime(
                                          calculateFutureDate(dd.daysToDeliver)
                                        ).dateOnly
                                      }
                                    </div>
                                    <div>
                                      {(dd.freeShippingMinPrice > 0 &&
                                      itemsPrice >= dd.freeShippingMinPrice
                                        ? 0
                                        : dd.shippingPrice) === 0 ? (
                                        t('freeShipping')
                                      ) : (
                                        <ProductPrice
                                          price={dd.shippingPrice}
                                          plain
                                        />
                                      )}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className='p-4'>
                    <Button
                      onClick={handleSelectItemsAndShipping}
                      className='rounded-full font-bold'
                      disabled={items.some((it) => it.quantity === 0)}
                    >
                      {t('continueToItems')}
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>2 </span>
                <span>{t('itemsAndShipping')}</span>
              </div>
            )}
          </div>
          {/* payment method */}
          <div>
            {isPaymentMethodSelected && paymentMethod ? (
              <div className='grid grid-cols-1 md:grid-cols-12 my-3 pb-3'>
                <div className='col-span-5 flex text-lg font-bold'>
                  <span className='w-8'>3 </span>
                  <span>{t('paymentMethod')}</span>
                </div>
                <div className='col-span-5'>
                  <p>
                    {paymentMethod === 'Pay Here'
                      ? t('payHere')
                      : t('payInStoreCash')}
                  </p>
                </div>
                <div className='col-span-2'>
                  <Button
                    onClick={() => {
                      setIsPaymentMethodSelected(false)
                    }}
                  >
                    {t('change')}
                  </Button>
                </div>
              </div>
            ) : isItemsSelected && totalPrice > 0 ? (
              <>
                <div className='flex text-primary text-lg font-bold my-2'>
                  <span className='w-8'>3 </span>
                  <span>{t('choosePaymentMethod')}</span>
                </div>
                <Card className='md:ml-8 my-4'>
                  <CardContent className='p-4'>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value)}
                    >
                      <div className='flex items-center py-1'>
                        <RadioGroupItem
                          value='Pay Here'
                          id='payment-pay-here'
                        />
                        <Label
                          className='font-bold pl-2 cursor-pointer'
                          htmlFor='payment-pay-here'
                        >
                          {t('payHere')}
                        </Label>
                      </div>
                      <div className='flex items-center py-1'>
                        <RadioGroupItem
                          value='Cash On Delivery'
                          id='payment-cash-delivery'
                        />
                        <Label
                          className='font-bold pl-2 cursor-pointer'
                          htmlFor='payment-cash-delivery'
                        >
                          {t('payInStoreCash')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className='p-4'>
                    <Button
                      onClick={handleSelectPaymentMethod}
                      className='rounded-full font-bold'
                    >
                      {t('useThisPaymentMethod')}
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : isItemsSelected && totalPrice === 0 ? (
              <>
                <div className='flex text-green-600 text-lg font-bold my-2'>
                  <span className='w-8'>3 </span>
                  <span>{t('freeOrder')}</span>
                </div>
                <Card className='md:ml-8 my-4'>
                  <CardContent className='p-4'>
                    <p className='text-green-600 font-semibold'>
                      {t('freeOrderMessage')}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>3 </span>
                <span>{t('choosePaymentMethod')}</span>
              </div>
            )}
          </div>
          {isAddressSelected && isItemsSelected && (
            <div className='mt-6'>
              <div className='block md:hidden'>
                <CheckoutSummary />
              </div>

              <Card className='hidden md:block '>
                <CardContent className='p-4 flex flex-col md:flex-row justify-between items-center gap-3'>
                  <Button
                    onClick={
                      isPaymentMethodSelected
                        ? handlePlaceOrder
                        : handleSelectPaymentMethod
                    }
                    className='rounded-full'
                    disabled={items.some((it) => it.quantity === 0)}
                  >
                    {isPaymentMethodSelected
                      ? t('placeYourOrder')
                      : totalPrice === 0
                        ? t('placeYourOrder')
                        : paymentMethod === 'Cash On Delivery'
                          ? t('placeYourOrder')
                          : t('useThisPaymentMethod')}
                  </Button>
                  <div className='flex-1'>
                    <p className='font-bold text-lg'>
                      {t('orderTotal')}:{' '}
                      <ProductPrice price={totalPrice} plain />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <CheckoutFooter />
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
export default CheckoutForm
