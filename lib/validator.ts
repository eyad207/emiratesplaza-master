import { z } from 'zod'
import { formatNumberWithDecimal } from './utils'

// Common
const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid MongoDB ID' })

const Price = (field: string) =>
  z.coerce
    .number()
    .refine((value) => {
      // Convert to number, round to 2 decimal places, then check format
      const rounded = Math.round((value + Number.EPSILON) * 100) / 100
      const formatted = formatNumberWithDecimal(rounded)
      return /^\d+\.\d{2}$/.test(formatted)
    }, `${field} must have exactly two decimal places (e.g., 49.99)`)
    .transform((value) => {
      // Always return properly rounded value
      return Math.round((value + Number.EPSILON) * 100) / 100
    })

const SizeSchema = z.object({
  size: z.string(),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative('Count in stock must be a non-negative number'),
})

const ColorSchema = z.object({
  color: z.string(),
  sizes: z.array(SizeSchema).default([]),
})

export const ReviewInputSchema = z.object({
  product: MongoId,
  user: MongoId,
  isVerifiedPurchase: z.boolean(),
  title: z.string().min(1, 'Title is required'),
  comment: z.string().min(1, 'Comment is required'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
})

export const ProductInputSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string()).min(1, 'Product must have at least one image'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().min(1, 'Description is required'),
  isPublished: z.boolean(),
  price: Price('Price'),
  tags: z.array(z.string()).default([]),
  colors: z.array(ColorSchema).default([]),
  avgRating: z.coerce
    .number()
    .min(0, 'Average rating must be at least 0')
    .max(5, 'Average rating must be at most 5'),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative('Number of reviews must be a non-negative number'),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  reviews: z.array(ReviewInputSchema).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative('Number of sales must be a non-negative number'),
})

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string(),
})

// Order Item
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  product: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z
    .number()
    .int()
    .nonnegative('Quantity must be a non-negative number'),
  colors: z.array(ColorSchema).default([]),
  image: z.string().min(1, 'Image is required'),
  price: Price('Price'),
  discountedPrice: Price('Discounted Price').optional(),
  discount: z.number().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
})
export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  province: z.string().min(1, 'Province is required'),
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
})

// Order
export const OrderInputSchema = z.object({
  user: z.union([
    MongoId,
    z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  ]),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentResult: z
    .object({
      id: z.string(),
      status: z.string(),
      email_address: z.string(),
      pricePaid: z.string(),
    })
    .optional(),
  itemsPrice: Price('Items price'),
  shippingPrice: Price('Shipping price'),
  taxPrice: Price('Tax price'),
  totalPrice: Price('Total price'),
  expectedDeliveryDate: z
    .date()
    .refine(
      (value) => value > new Date(),
      'Expected delivery date must be in the future'
    ),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.date().optional(),
  isShipped: z.boolean().default(false),
  shippedAt: z.date().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
  adminNotes: z.string().optional(),
})
// Cart

export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  itemsPrice: z.number(),
  taxPrice: z.optional(z.number()),
  shippingPrice: z.optional(z.number()),
  totalPrice: z.number(),
  paymentMethod: z.optional(z.string()),
  shippingAddress: z.optional(ShippingAddressSchema),
  deliveryDateIndex: z.optional(z.number()),
  expectedDeliveryDate: z.optional(z.date()),
})

// USER
const UserName = z
  .string()
  .min(2, { message: 'Username must be at least 2 characters' })
  .max(50, { message: 'Username must be at most 30 characters' })
const Email = z.string().min(1, 'Email is required').email('Email is invalid')
const Password = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
const UserRole = z.string().min(1, 'role is required')

const UserEmail = z.string().email('Email is invalid')
const UserPassword = z.string().min(6, 'Password must be at least 6 characters')

export const UserEmailSchema = z.object({
  email: UserEmail,
  password: UserPassword,
})

export const UserPasswordSchema = z
  .object({
    oldPassword: Password,
    password: Password,
    confirmPassword: Password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one capital letter'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm Password must be at least 8 characters long'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  email: Email,
  role: UserRole,
})

export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  address: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
})

export const UserSignInSchema = z.object({
  email: Email,
  password: z.string().min(1, 'Password is required'), // Simplified password validation for sign-in
})
export const UserSignUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: Password,
    confirmPassword: Password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export const UserNameSchema = z.object({
  name: UserName,
})

// WEBPAGE
export const WebPageInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  content: z.string().min(1, 'Content is required'),
  isPublished: z.boolean(),
})

export const WebPageUpdateSchema = WebPageInputSchema.extend({
  _id: z.string(),
})

// Setting

export const SiteLanguageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  icon: z.string().min(1, 'Icon is required'),
})
export const CarouselSchema = z.object({
  title: z.string().min(1, 'title is required'),
  url: z.string().min(1, 'url is required'),
  image: z.string().min(1, 'image is required'),
  buttonCaption: z.string().min(1, 'buttonCaption is required'),
})

export const SiteCurrencySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  convertRate: z.coerce.number().min(0, 'Convert rate must be at least 0'),
  symbol: z.string().min(1, 'Symbol is required'),
})

export const PaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  commission: z.coerce.number().min(0, 'Commission must be at least 0'),
})

export const DeliveryDateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  daysToDeliver: z.number().min(0, 'Days to deliver must be at least 0'),
  shippingPrice: z.coerce.number().min(0, 'Shipping price must be at least 0'),
  freeShippingMinPrice: z.coerce
    .number()
    .min(0, 'Free shipping min amount must be at least 0'),
})

export const SettingInputSchema = z.object({
  // PROMPT: create fields
  // codeium, based on the mongoose schema for settings
  common: z.object({
    pageSize: z.coerce
      .number()
      .min(1, 'Page size must be at least 1')
      .default(9),
    isMaintenanceMode: z.boolean().default(false),
    freeShippingMinPrice: z.coerce
      .number()
      .min(0, 'Free shipping min price must be at least 0')
      .default(0),
    defaultTheme: z
      .string()
      .min(1, 'Default theme is required')
      .default('light'),
    defaultColor: z
      .string()
      .min(1, 'Default color is required')
      .default('gold'),
  }),
  site: z.object({
    name: z.string().min(1, 'Name is required'),
    logo: z.string().min(1, 'logo is required'),
    slogan: z.string().min(1, 'Slogan is required'),
    description: z.string().min(1, 'Description is required'),
    keywords: z.string().min(1, 'Keywords is required'),
    url: z.string().min(1, 'Url is required'),
    email: z.string().min(1, 'Email is required'),
    phone: z.string().min(1, 'Phone is required'),
    author: z.string().min(1, 'Author is required'),
    copyright: z.string().min(1, 'Copyright is required'),
    address: z.string().min(1, 'Address is required'),
  }),
  availableLanguages: z
    .array(SiteLanguageSchema)
    .min(1, 'At least one language is required'),

  carousels: z
    .array(CarouselSchema)
    .min(1, 'At least one language is required'),
  defaultLanguage: z.string().min(1, 'Language is required'),
  availableCurrencies: z
    .array(SiteCurrencySchema)
    .min(1, 'At least one currency is required'),
  defaultCurrency: z.string().min(1, 'Currency is required'),
  availablePaymentMethods: z
    .array(PaymentMethodSchema)
    .min(1, 'At least one payment method is required'),
  defaultPaymentMethod: z.string().min(1, 'Payment method is required'),
  availableDeliveryDates: z
    .array(DeliveryDateSchema)
    .min(1, 'At least one delivery date is required'),
  defaultDeliveryDate: z.string().min(1, 'Delivery date is required'),
})
