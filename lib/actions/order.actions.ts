'use server'

import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import { round2 } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { paypal } from '../paypal'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import mongoose from 'mongoose'
import { getSetting } from './setting.actions'
import { sendEmail } from '@/lib/email'
import { vipps } from '../vipps'
import Stripe from 'stripe'
import type { SortOrder } from 'mongoose'
import { validateCart } from '../cart-validation'

// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')

    // Additional validation for required fields
    if (!clientSideCart.shippingAddress) {
      throw new Error('Shipping address is required')
    }

    if (!clientSideCart.paymentMethod) {
      throw new Error('Payment method is required')
    }

    // ✅ Comprehensive cart validation with database checks
    const validation = await validateCart(clientSideCart)

    if (!validation.isValid) {
      const errorMessage =
        validation.errors.length > 0
          ? validation.errors.join('; ')
          : 'Cart validation failed'
      throw new Error(errorMessage)
    }

    // If there are invalid items, only proceed with valid items
    if (validation.invalidItems.length > 0) {
      console.warn(
        'Found invalid items in cart:',
        validation.invalidItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        }))
      )
    }

    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )
    // If the order total is 0 or payment method is 'Free Order', mark as paid
    if (
      createdOrder.totalPrice === 0 ||
      createdOrder.paymentMethod === 'Free Order'
    ) {
      await updateOrderToPaid(createdOrder._id.toString())
      return {
        success: true,
        message: 'Free order placed successfully!',
        data: { orderId: createdOrder._id.toString() },
      }
    }

    // If payment method is 'Cash On Delivery', mark as placed but not paid
    if (createdOrder.paymentMethod === 'Cash On Delivery') {
      return {
        success: true,
        message: 'Order placed successfully!',
        data: { orderId: createdOrder._id.toString() },
      }
    }

    return {
      success: true,
      message: 'Processing to payment ...',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    console.error('Error creating order:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
      }
    }

    return {
      success: false,
      message: 'Failed to create order: An unexpected error occurred',
    }
  }
}
export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string
) => {
  const cartCalculations = await calcDeliveryDateAndPrice({
    items: clientSideCart.items,
    shippingAddress: clientSideCart.shippingAddress,
    deliveryDateIndex: clientSideCart.deliveryDateIndex,
  })

  const cart = {
    ...clientSideCart,
    ...cartCalculations,
  }

  const order = OrderInputSchema.parse({
    user: userId,
    items: cart.items.map((item) => ({
      ...item,
      // Ensure price fields are properly formatted - use the same logic as the validator
      price: Math.round((item.price + Number.EPSILON) * 100) / 100,
      discountedPrice: item.discountedPrice
        ? Math.round((item.discountedPrice + Number.EPSILON) * 100) / 100
        : undefined,
    })),
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  })
  return await Order.create(order)
}

export async function updateOrderToPaid(orderId: string) {
  try {
    await connectToDatabase()
    const session = await mongoose.connection.startSession()

    try {
      session.startTransaction()
      const opts = { session }

      const order = await Order.findById(orderId).populate<{
        user: { email: string; name: string }
      }>('user', 'name email')
      if (!order) throw new Error('Order not found')
      if (order.isPaid) throw new Error('Order is already paid')

      // Mark the order as paid
      order.isPaid = true
      order.paidAt = new Date()

      // For free orders, set a specific payment result to identify them
      if (order.totalPrice === 0 || order.paymentMethod === 'Free Order') {
        order.paymentResult = {
          id: 'FREE_ORDER',
          status: 'COMPLETED',
          email_address: order.user?.email || '',
          pricePaid: '0.00',
        }
      }

      await order.save(opts)

      // Update product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session)
        if (!product) throw new Error('Product not found')

        const color = product.colors.find((c) => c.color === item.color)
        if (!color) throw new Error('Color not found')

        const size = color.sizes.find((s) => s.size === item.size)
        if (!size) throw new Error('Size not found')

        size.countInStock -= item.quantity
        if (size.countInStock < 0) throw new Error('Insufficient stock')

        await product.save(opts)
      }

      await session.commitTransaction()
      session.endSession()

      // Send purchase receipt email
      if (order.user?.email) await sendPurchaseReceipt({ order })

      revalidatePath(`/account/orders/${orderId}`)
      return { success: true, message: 'Order paid successfully' }
    } catch {
      await session.abortTransaction()
      session.endSession()
      throw new Error('Payment processing failed')
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export const updateProductStock = async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { isPaid: true, paidAt: new Date() },
      opts
    ).populate('user', 'email') // Ensure user is populated
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      const color = product.colors.find((c) => c.color === item.color)
      if (!color) throw new Error('Color not found')

      const size = color.sizes.find((s) => s.size === item.size)
      if (!size) throw new Error('Size not found')

      size.countInStock -= item.quantity
      await product.save(opts)
    }
    await session.commitTransaction()
    session.endSession()
    return true
  } catch {
    await session.abortTransaction()
    session.endSession()
    throw new Error('Transaction failed')
  }
}

export async function deliverOrder(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = !order.isDelivered
    order.deliveredAt = order.isDelivered ? new Date() : undefined
    await order.save()
    if (order.user?.email) {
      await sendAskReviewOrderItems({ order })
      await sendEmail({
        to: order.user.email,
        subject: 'Fraktstatus for bestillingen er oppdatert',
        text: `Kjære ${order.user.name},

Vi har gleden av å informere deg om at bestillingen din med ID ${order._id} har blitt ${order.isDelivered ? 'levert' : 'markert som ikke levert'}.

Takk for at du handlet hos oss!

Med vennlig hilsen,
EmiratesPlaza Kundeservice`,
      })
    }
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Fraktstatus for bestillingen er oppdatert',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export async function shipOrder(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isShipped = !order.isShipped
    order.shippedAt = order.isShipped ? new Date() : undefined
    await order.save()
    if (order.user?.email) {
      await sendEmail({
        to: order.user.email,
        subject: 'Fraktstatus for bestillingen er oppdatert',
        text: `Kjære ${order.user.name},

Vi har gleden av å informere deg om at bestillingen din med ID ${order._id} har blitt ${order.isShipped ? 'sendt' : 'markert som ikke sendt'}.

Takk for at du handlet hos oss!

Med vennlig hilsen,
EmiratesPlaza Kundeservice`,
      })
    }
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Fraktstatusen for bestillingen er oppdatert',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    await connectToDatabase()
    const res = await Order.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'Order deleted successfully',
    }
  } catch {
    return { success: false, message: 'Failed to delete order' }
  }
}
// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
  orderId,
  sort = 'createdAt', // default sort field
  order = 'desc', // default sort order
}: {
  limit?: number
  page: number
  orderId?: string
  sort?: string
  order?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize

  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit

  const filter = {
    $or: [
      { isPaid: true }, // Include paid orders
      { paymentMethod: 'Cash On Delivery' }, // Include COD orders
    ],
    ...(orderId && mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : {}),
  }

  // Prepare the sort object
  const sortOrder: SortOrder = order === 'asc' ? 1 : -1
  const sortObject: { [key: string]: SortOrder } = { [sort]: sortOrder }

  const orders = await Order.find(filter)
    .populate('user', 'name')
    .sort(sortObject) // use dynamic sort
    .skip(skipAmount)
    .limit(limit)

  const ordersCount = await Order.countDocuments(filter)

  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}

export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
    $or: [
      { isPaid: true }, // Include paid orders
      { paymentMethod: 'Cash On Delivery' }, // Include COD orders
    ],
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({
    user: session?.user?.id,
    $or: [
      { isPaid: true }, // Include paid orders
      { paymentMethod: 'Cash On Delivery' }, // Include COD orders
    ],
  })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  const order = await Order.findById(orderId).populate('user', 'email')
  return JSON.parse(JSON.stringify(order))
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Always use NOK for payments regardless of display currency
    const paymentCurrency = 'NOK'
    const orderPrice = order.totalPrice // Already in NOK (base currency)

    // Validate price is reasonable (basic sanity check)
    if (orderPrice <= 0 || orderPrice > 1000000) {
      return {
        success: false,
        message: `Invalid order price: ${orderPrice}`,
      }
    }

    const paypalOrder = await paypal.createOrder(orderPrice, paymentCurrency)
    order.paymentResult = {
      id: paypalOrder.id,
      email_address: '',
      status: '',
      pricePaid: '0',
    }
    await order.save()
    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    }
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create PayPal order',
    }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId).populate('user', 'email')
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    const captureData = await paypal.capturePayment(data.orderID)
    if (!captureData) {
      return { success: false, message: 'Failed to capture PayPal payment' }
    }

    if (captureData.id !== order.paymentResult?.id) {
      return { success: false, message: 'PayPal order ID mismatch' }
    }

    if (captureData.status !== 'COMPLETED') {
      return {
        success: false,
        message: `PayPal payment not completed. Status: ${captureData.status}`,
      }
    }

    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
    await updateProductStock(order._id)
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (error) {
    console.error('PayPal order approval error:', error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to approve PayPal payment',
    }
  }
}

export const createVippsOrder = async (orderId: string, amount: number) => {
  try {
    const payment = await vipps.createPayment(orderId, amount)
    return {
      success: true,
      data: payment,
      message: 'Vipps payment created successfully.',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to create Vipps payment.',
    }
  }
}

export const approveVippsOrder = async (orderId: string) => {
  try {
    const payment = await vipps.capturePayment(orderId)
    return {
      success: true,
      data: payment,
      message: 'Vipps payment approved successfully.',
    }
  } catch {
    return {
      success: false,
      message: 'Failed to approve Vipps payment.',
    }
  }
}

export async function createStripePaymentIntent(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    // Use the order's original total price without currency conversion
    const orderPrice = order.totalPrice

    // Validate price is reasonable (basic sanity check)
    if (orderPrice <= 0 || orderPrice > 1000000) {
      return {
        success: false,
        message: `Invalid order price: ${orderPrice}`,
      }
    }

    // Verify Stripe secret key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, message: 'Stripe configuration missing' }
    }

    // Create Stripe payment intent with the exact order price
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderPrice * 100), // Stripe expects amount in cents
      currency: 'NOK', // Use NOK as the base currency for all orders
      metadata: { orderId: order._id.toString() }, // Convert ObjectId to string
    })

    return {
      success: true,
      message: 'Stripe payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        convertedPrice: orderPrice, // Return the exact order price
      },
    }
  } catch (error) {
    console.error('Stripe payment intent creation error:', error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create Stripe payment intent',
    }
  }
}

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = await getSetting()
  const itemsPrice = round2(
    items.reduce((acc, item) => {
      const effectivePrice = item.discountedPrice ?? item.price
      return acc + effectivePrice * item.quantity
    }, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.15)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )

  // Calculate expected delivery date
  const expectedDeliveryDate = deliveryDate
    ? new Date(Date.now() + deliveryDate.daysToDeliver * 24 * 60 * 60 * 1000)
    : undefined

  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    expectedDeliveryDate,
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  // Current date-filtered counts
  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  // Date-filtered total sales
  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  // 🚀 ADD All-Time Totals 🚀
  const allTimeOrdersCount = await Order.countDocuments()
  const allTimeProductsCount = await Product.countDocuments()
  const allTimeUsersCount = await User.countDocuments()

  const allTimeSalesResult = await Order.aggregate([
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const allTimeTotalSales = allTimeSalesResult[0]
    ? allTimeSalesResult[0].totalSales
    : 0

  // The rest of your code unchanged
  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },
    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)

  // 👉 Add your new values to the return:
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,

    allTimeOrdersCount,
    allTimeProductsCount,
    allTimeUsersCount,
    allTimeTotalSales,

    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}

// GET ORDERS BY USER ID
export async function getOrdersByUserId({
  limit,
  page,
  userId,
  orderId,
}: {
  limit?: number
  page: number
  userId: string
  orderId?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const filter = {
    user: userId,
    $or: [
      { isPaid: true }, // Include paid orders
      { paymentMethod: 'Cash On Delivery' }, // Include COD orders
    ],
    ...(orderId && mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : {}),
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments(filter)
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrder[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}

export async function getRecentOrders(userId: string) {
  try {
    await connectToDatabase()
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    return JSON.parse(JSON.stringify(orders))
  } catch {
    return []
  }
}

export const markOrderAsViewed = async (orderId: string) => {
  try {
    await Order.findByIdAndUpdate(orderId, { viewed: true })
  } catch {
    // Silently handle errors
  }
}

export const updateOrderAdminNotes = async (
  orderId: string,
  adminNotes: string
) => {
  try {
    await connectToDatabase()
    const session = await auth()

    if (!session || session.user.role !== 'Admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    const order = await Order.findById(orderId)

    if (!order) {
      throw new Error('Order not found')
    }

    order.adminNotes = adminNotes
    await order.save()

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath(`/account/orders/${orderId}`)

    return {
      success: true,
      message: 'Admin notes updated successfully',
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update admin notes',
    }
  }
}

export const deleteAllOrders = async () => {
  await connectToDatabase()
  await Order.deleteMany({})
}
