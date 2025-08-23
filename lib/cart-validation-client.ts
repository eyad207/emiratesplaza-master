import { Cart, OrderItem } from '@/types'

export interface CartValidationResult {
  isValid: boolean
  errors: string[]
  validItems: OrderItem[]
  invalidItems: OrderItem[]
  warnings: string[]
}

export interface CartValidationError {
  itemId: string
  itemName: string
  error: string
  severity: 'error' | 'warning'
}

export interface StockValidationResult {
  isValid: boolean
  stockIssues: Array<{
    itemId: string
    itemName: string
    availableStock: number
    requestedQuantity: number
    color: string
    size: string
  }>
}

/**
 * Enhanced client-side cart validation with comprehensive checks
 */
export function validateCartClientSide(cart: Cart): CartValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validItems: OrderItem[] = []
  const invalidItems: OrderItem[] = []

  // Basic cart validation
  if (!cart.items || cart.items.length === 0) {
    return {
      isValid: false,
      errors: ['Cart is empty'],
      validItems: [],
      invalidItems: [],
      warnings: [],
    }
  }

  // Validate cart structure
  if (typeof cart.itemsPrice !== 'number' || cart.itemsPrice < 0) {
    warnings.push('Cart pricing information may be outdated')
  }

  for (const item of cart.items) {
    const itemErrors: string[] = []
    const itemWarnings: string[] = []

    // Validate item structure
    if (!item.product || !item.name || !item.slug) {
      itemErrors.push(
        `Invalid item structure for ${item.name || 'unknown item'}`
      )
      invalidItems.push(item)
      continue
    }

    // Check quantity validity
    if (
      typeof item.quantity !== 'number' ||
      item.quantity <= 0 ||
      Number.isNaN(item.quantity)
    ) {
      itemErrors.push(`Invalid quantity (${item.quantity}) for ${item.name}`)
      invalidItems.push(item)
      continue
    }

    // Check if item is an integer
    if (!Number.isInteger(item.quantity)) {
      itemErrors.push(`Quantity must be a whole number for ${item.name}`)
      invalidItems.push(item)
      continue
    }

    // Check maximum reasonable quantity (prevent abuse)
    if (item.quantity > 99) {
      itemWarnings.push(`Large quantity (${item.quantity}) for ${item.name}`)
    }

    // Validate price
    if (typeof item.price !== 'number' || item.price < 0) {
      itemErrors.push(`Invalid price for ${item.name}`)
      invalidItems.push(item)
      continue
    }

    // Check if color and size are selected for items that require them
    if (item.colors && item.colors.length > 0) {
      if (!item.color) {
        itemErrors.push(`Color not selected for ${item.name}`)
        invalidItems.push(item)
        continue
      }

      const colorObj = item.colors.find((c) => c.color === item.color)
      if (!colorObj) {
        itemErrors.push(
          `Selected color (${item.color}) not available for ${item.name}`
        )
        invalidItems.push(item)
        continue
      }

      // Check size if sizes are available
      if (colorObj.sizes && colorObj.sizes.length > 0) {
        if (!item.size) {
          itemErrors.push(`Size not selected for ${item.name}`)
          invalidItems.push(item)
          continue
        }

        const sizeObj = colorObj.sizes.find((s) => s.size === item.size)
        if (!sizeObj) {
          itemErrors.push(
            `Selected size (${item.size}) not available for ${item.name}`
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

        // Warn if stock is low
        if (
          sizeObj.countInStock <= 3 &&
          sizeObj.countInStock >= item.quantity
        ) {
          itemWarnings.push(
            `Low stock for ${item.name} (${sizeObj.countInStock} remaining)`
          )
        }
      }
    }

    // Validate image URL
    if (!item.image || typeof item.image !== 'string') {
      itemWarnings.push(`Missing or invalid image for ${item.name}`)
    }

    // If we reach here, the item passed all validations
    validItems.push(item)
    errors.push(...itemErrors)
    warnings.push(...itemWarnings)
  }

  return {
    isValid: errors.length === 0 && validItems.length > 0,
    errors,
    validItems,
    invalidItems,
    warnings,
  }
}

/**
 * Validate stock availability for cart items
 */
export function validateCartStock(items: OrderItem[]): StockValidationResult {
  const stockIssues: StockValidationResult['stockIssues'] = []

  for (const item of items) {
    if (!item.colors || !item.color || !item.size) continue

    const colorObj = item.colors.find((c) => c.color === item.color)
    if (!colorObj || !colorObj.sizes) continue

    const sizeObj = colorObj.sizes.find((s) => s.size === item.size)
    if (!sizeObj) continue

    if (sizeObj.countInStock < item.quantity) {
      stockIssues.push({
        itemId: item.clientId || item.product,
        itemName: item.name,
        availableStock: sizeObj.countInStock,
        requestedQuantity: item.quantity,
        color: item.color,
        size: item.size,
      })
    }
  }

  return {
    isValid: stockIssues.length === 0,
    stockIssues,
  }
}

/**
 * Check if cart has any items with zero or invalid quantities
 */
export function hasInvalidQuantities(items: OrderItem[]): boolean {
  return items.some(
    (item) =>
      !item.quantity ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity) ||
      Number.isNaN(item.quantity)
  )
}

/**
 * Get all items with invalid quantities
 */
export function getInvalidQuantityItems(items: OrderItem[]): OrderItem[] {
  return items.filter(
    (item) =>
      !item.quantity ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity) ||
      Number.isNaN(item.quantity)
  )
}

/**
 * Enhanced checkout readiness validation
 */
export function isCartReadyForCheckout(cart: Cart): boolean {
  if (!cart.items || cart.items.length === 0) return false

  const validation = validateCartClientSide(cart)
  const stockValidation = validateCartStock(cart.items)

  return (
    validation.isValid &&
    stockValidation.isValid &&
    !hasInvalidQuantities(cart.items)
  )
}

/**
 * Get cart summary with validation status
 */
export function getCartSummary(cart: Cart) {
  const validation = validateCartClientSide(cart)
  const stockValidation = validateCartStock(cart.items)
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    totalItems,
    validItemsCount: validation.validItems.length,
    invalidItemsCount: validation.invalidItems.length,
    hasErrors: !validation.isValid,
    hasWarnings: validation.warnings.length > 0,
    hasStockIssues: !stockValidation.isValid,
    canCheckout: isCartReadyForCheckout(cart),
    errors: validation.errors,
    warnings: validation.warnings,
    stockIssues: stockValidation.stockIssues,
  }
}
