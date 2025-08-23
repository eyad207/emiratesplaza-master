'use server'

import { Cart, OrderItem } from '@/types'
import { connectToDatabase } from './db'
import Product from './db/models/product.model'

export interface CartValidationResult {
  isValid: boolean
  errors: string[]
  validItems: OrderItem[]
  invalidItems: OrderItem[]
  warnings: string[]
  outdatedItems: OrderItem[]
}

export interface CartValidationError {
  itemId: string
  itemName: string
  error: string
  severity: 'error' | 'warning'
}

export interface ProductSyncResult {
  hasChanges: boolean
  priceChanges: Array<{
    itemId: string
    itemName: string
    oldPrice: number
    newPrice: number
    changeType: 'increase' | 'decrease'
  }>
  stockChanges: Array<{
    itemId: string
    itemName: string
    oldStock: number
    newStock: number
    color: string
    size: string
  }>
  discontinuedItems: OrderItem[]
}

/**
 * Comprehensive server-side cart validation with database verification
 */
export async function validateCart(cart: Cart): Promise<CartValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const validItems: OrderItem[] = []
  const invalidItems: OrderItem[] = []
  const outdatedItems: OrderItem[] = []

  // Basic cart validation
  if (!cart.items || cart.items.length === 0) {
    return {
      isValid: false,
      errors: ['Cart is empty'],
      validItems: [],
      invalidItems: [],
      warnings: [],
      outdatedItems: [],
    }
  }

  try {
    // Connect to database to check current product data
    await connectToDatabase()

    for (const item of cart.items) {
      const itemErrors: string[] = []
      const itemWarnings: string[] = []

      // Basic item validation
      if (!item.product || !item.name) {
        itemErrors.push(`Invalid item structure`)
        invalidItems.push(item)
        continue
      }

      // Check quantity validity
      if (
        typeof item.quantity !== 'number' ||
        item.quantity <= 0 ||
        Number.isNaN(item.quantity) ||
        !Number.isInteger(item.quantity)
      ) {
        itemErrors.push(`Invalid quantity (${item.quantity}) for ${item.name}`)
        invalidItems.push(item)
        continue
      }

      // Validate against database
      try {
        const product = await Product.findById(item.product).lean()

        if (!product) {
          itemErrors.push(`Product ${item.name} no longer exists`)
          invalidItems.push(item)
          continue
        }

        // Check if product is still active/published
        if (!product.isPublished) {
          itemErrors.push(`Product ${item.name} is no longer available`)
          invalidItems.push(item)
          continue
        }

        // Check price changes
        if (product.price !== item.price) {
          outdatedItems.push(item)
          if (product.price > item.price) {
            itemWarnings.push(
              `Price increased for ${item.name}: ${item.price} → ${product.price}`
            )
          } else {
            itemWarnings.push(
              `Price decreased for ${item.name}: ${item.price} → ${product.price}`
            )
          }
        }

        // Validate color availability
        if (item.color) {
          const colorObj = product.colors.find(
            (c: {
              color: string
              sizes: { size: string; countInStock: number }[]
            }) => c.color === item.color
          )

          if (!colorObj) {
            itemErrors.push(
              `Color ${item.color} is no longer available for ${item.name}`
            )
            invalidItems.push(item)
            continue
          }

          // Validate size availability
          if (item.size) {
            const sizeObj = colorObj.sizes.find(
              (s: { size: string; countInStock: number }) =>
                s.size === item.size
            )

            if (!sizeObj) {
              itemErrors.push(
                `Size ${item.size} is no longer available for ${item.name}`
              )
              invalidItems.push(item)
              continue
            }

            // Check stock availability
            if (sizeObj.countInStock < item.quantity) {
              itemErrors.push(
                `Insufficient stock for ${item.name}. Available: ${sizeObj.countInStock}, Requested: ${item.quantity}`
              )
              invalidItems.push(item)
              continue
            }

            // Warn about low stock
            if (
              sizeObj.countInStock <= 3 &&
              sizeObj.countInStock >= item.quantity
            ) {
              itemWarnings.push(
                `Low stock warning for ${item.name}: only ${sizeObj.countInStock} remaining`
              )
            }

            // Check if stock changed
            const currentCartStock = item.colors
              ?.find((c) => c.color === item.color)
              ?.sizes?.find((s) => s.size === item.size)?.countInStock

            if (
              currentCartStock !== undefined &&
              currentCartStock !== sizeObj.countInStock
            ) {
              outdatedItems.push(item)
              itemWarnings.push(
                `Stock updated for ${item.name}: ${currentCartStock} → ${sizeObj.countInStock}`
              )
            }
          }
        }

        // Check category changes
        if (product.category !== item.category) {
          outdatedItems.push(item)
          itemWarnings.push(`Category changed for ${item.name}`)
        }

        // If we reach here, the item is valid
        validItems.push(item)
      } catch (dbError) {
        console.error(`Database error validating item ${item.name}:`, dbError)
        itemErrors.push(`Failed to validate ${item.name}: database error`)
        invalidItems.push(item)
      }

      errors.push(...itemErrors)
      warnings.push(...itemWarnings)
    }
  } catch (error) {
    console.error('Cart validation error:', error)
    return {
      isValid: false,
      errors: ['Failed to validate cart: database connection error'],
      validItems: [],
      invalidItems: cart.items,
      warnings: [],
      outdatedItems: [],
    }
  }

  return {
    isValid: errors.length === 0 && validItems.length > 0,
    errors,
    validItems,
    invalidItems,
    warnings,
    outdatedItems,
  }
}

/**
 * Sync cart items with current database data
 */
export async function syncCartWithDatabase(
  cartItems: OrderItem[]
): Promise<ProductSyncResult> {
  const priceChanges: ProductSyncResult['priceChanges'] = []
  const stockChanges: ProductSyncResult['stockChanges'] = []
  const discontinuedItems: OrderItem[] = []

  try {
    await connectToDatabase()

    for (const item of cartItems) {
      try {
        const product = await Product.findById(item.product).lean()

        if (!product || !product.isPublished) {
          discontinuedItems.push(item)
          continue
        }

        // Check price changes
        if (product.price !== item.price) {
          priceChanges.push({
            itemId: item.clientId || item.product,
            itemName: item.name,
            oldPrice: item.price,
            newPrice: product.price,
            changeType: product.price > item.price ? 'increase' : 'decrease',
          })
        }

        // Check stock changes
        if (item.color && item.size) {
          const colorObj = product.colors.find(
            (c: {
              color: string
              sizes: { size: string; countInStock: number }[]
            }) => c.color === item.color
          )

          if (colorObj) {
            const sizeObj = colorObj.sizes.find(
              (s: { size: string; countInStock: number }) =>
                s.size === item.size
            )

            if (sizeObj) {
              const currentCartStock = item.colors
                ?.find((c) => c.color === item.color)
                ?.sizes?.find((s) => s.size === item.size)?.countInStock

              if (
                currentCartStock !== undefined &&
                currentCartStock !== sizeObj.countInStock
              ) {
                stockChanges.push({
                  itemId: item.clientId || item.product,
                  itemName: item.name,
                  oldStock: currentCartStock,
                  newStock: sizeObj.countInStock,
                  color: item.color,
                  size: item.size,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing item ${item.name}:`, error)
        // Continue with other items
      }
    }
  } catch (error) {
    console.error('Database sync error:', error)
  }

  return {
    hasChanges:
      priceChanges.length > 0 ||
      stockChanges.length > 0 ||
      discontinuedItems.length > 0,
    priceChanges,
    stockChanges,
    discontinuedItems,
  }
}

/**
 * Get updated product data for cart items
 */
export async function getUpdatedCartItems(
  cartItems: OrderItem[]
): Promise<OrderItem[]> {
  try {
    await connectToDatabase()

    const updatedItems = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const product = await Product.findById(item.product).lean()

          if (!product || !product.isPublished) {
            return null // Item will be filtered out
          }

          // Update item with current database data
          const updatedItem: OrderItem = {
            ...item,
            price: product.price,
            colors: product.colors,
            category: product.category,
            // Adjust quantity if it exceeds available stock
            quantity:
              item.color && item.size
                ? Math.min(
                    item.quantity,
                    product.colors
                      .find(
                        (c: {
                          color: string
                          sizes: { size: string; countInStock: number }[]
                        }) => c.color === item.color
                      )
                      ?.sizes.find(
                        (s: { size: string; countInStock: number }) =>
                          s.size === item.size
                      )?.countInStock || 0
                  )
                : item.quantity,
          }

          return updatedItem
        } catch (error) {
          console.error(`Error updating item ${item.name}:`, error)
          return item // Return original item if update fails
        }
      })
    )

    // Filter out null items (discontinued products)
    return updatedItems.filter((item): item is OrderItem => item !== null)
  } catch (error) {
    console.error('Error getting updated cart items:', error)
    return cartItems // Return original items if update fails
  }
}
