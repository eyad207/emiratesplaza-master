import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (
    item: OrderItem,
    quantity: number
  ) => Promise<{ success: boolean; message?: string; clientId?: string }>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  refreshCartStock: () => Promise<void>
  refreshCartPrices: () => Promise<{
    hasChanges: boolean
    priceChanges: Array<{
      item: OrderItem
      oldPrice: number
      newPrice: number
      priceChange: number
      changeType: 'increase' | 'decrease'
    }>
  }>
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart

        // Enhanced validation before adding
        if (quantity <= 0 || !Number.isInteger(quantity)) {
          return {
            success: false,
            message: 'Invalid quantity. Must be a positive whole number.',
          }
        }

        if (quantity > 10) {
          return {
            success: false,
            message: 'Maximum quantity per item is 10.',
          }
        }

        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        // Enhanced stock validation
        const colorObj = item.colors.find((c) => c.color === item.color)
        const sizeObj = colorObj?.sizes.find((s) => s.size === item.size)

        if (!sizeObj) {
          return {
            success: false,
            message: 'Selected size is not available for this color.',
          }
        }

        if (sizeObj.countInStock === 0) {
          return {
            success: false,
            message: 'This item is currently out of stock.',
          }
        }

        const totalRequestedQuantity = existItem
          ? existItem.quantity + quantity
          : quantity

        if (sizeObj.countInStock < totalRequestedQuantity) {
          const available = sizeObj.countInStock
          const canAdd = existItem
            ? Math.max(0, available - existItem.quantity)
            : available

          if (canAdd === 0) {
            return {
              success: false,
              message: `No more items can be added. You already have the maximum available quantity (${available}) in your cart.`,
            }
          } else {
            return {
              success: false,
              message: `Only ${canAdd} more can be added to your cart. ${available} total available.`,
            }
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        try {
          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...(await calcDeliveryDateAndPrice({
                items: updatedCartItems,
                shippingAddress,
              })),
            },
          })

          const foundItem = updatedCartItems.find(
            (x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
          )

          if (!foundItem) {
            return { success: false, message: 'Failed to add item to cart.' }
          }

          return { success: true, clientId: foundItem.clientId }
        } catch (error) {
          console.error('Error adding item to cart:', error)
          return { success: false, message: 'Failed to add item to cart.' }
        }
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (!exist) {
          console.warn('Attempted to update non-existent cart item')
          return
        }

        // Enhanced validation for quantity updates
        if (quantity < 0 || !Number.isInteger(quantity)) {
          console.warn('Invalid quantity for update:', quantity)
          return
        }

        if (quantity > 10) {
          console.warn('Quantity exceeds maximum allowed:', quantity)
          return
        }

        let updatedCartItems
        if (quantity === 0) {
          // Remove the item if quantity is 0
          updatedCartItems = items.filter(
            (x) =>
              x.product !== item.product ||
              x.color !== item.color ||
              x.size !== item.size
          )
        } else {
          // Validate stock before updating
          const colorObj = item.colors?.find((c) => c.color === item.color)
          const sizeObj = colorObj?.sizes?.find((s) => s.size === item.size)

          if (sizeObj && sizeObj.countInStock < quantity) {
            console.warn(
              `Insufficient stock for update. Available: ${sizeObj.countInStock}, Requested: ${quantity}`
            )
            // Set to maximum available instead of failing
            quantity = sizeObj.countInStock
          }

          // Update the item quantity
          updatedCartItems = items.map((x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
              ? { ...exist, quantity: quantity }
              : x
          )
        }

        try {
          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...(await calcDeliveryDateAndPrice({
                items: updatedCartItems,
                shippingAddress,
              })),
            },
          })
        } catch (error) {
          console.error('Error updating cart item:', error)
        }
      },
      removeItem: async (item: OrderItem) => {
        const { items, shippingAddress } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const { items } = get().cart
        set({
          cart: {
            ...get().cart,
            shippingAddress,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress,
            })),
          },
        })
      },
      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        const { items, shippingAddress } = get().cart

        set({
          cart: {
            ...get().cart,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress,
              deliveryDateIndex: index,
            })),
          },
        })
      },
      clearCart: () => {
        set({
          cart: {
            ...get().cart,
            items: [],
          },
        })
      },
      refreshCartStock: async () => {
        const { items } = get().cart

        if (items.length === 0) return

        try {
          const updatedItems = await Promise.all(
            items.map(async (item) => {
              try {
                const response = await fetch(`/api/products/${item.product}`, {
                  method: 'GET',
                  headers: {
                    'Cache-Control': 'no-cache',
                  },
                })

                if (!response.ok) {
                  console.warn(
                    `Product ${item.product} not found, removing from cart`
                  )
                  return null
                }

                const data = await response.json()

                // Validate product is still available
                if (!data.isPublished) {
                  console.warn(`Product ${item.name} is no longer available`)
                  return null
                }

                const colorObj = data.colors.find(
                  (c: {
                    color: string
                    sizes: { size: string; countInStock: number }[]
                  }) => c.color === item.color
                )

                if (!colorObj) {
                  console.warn(
                    `Color ${item.color} no longer available for ${item.name}`
                  )
                  return null
                }

                const sizeObj = colorObj.sizes.find(
                  (s: { size: string; countInStock: number }) =>
                    s.size === item.size
                )

                if (!sizeObj) {
                  console.warn(
                    `Size ${item.size} no longer available for ${item.name}`
                  )
                  return null
                }

                // Update with current data and adjust quantity if needed
                return {
                  ...item,
                  colors: data.colors,
                  category: data.category,
                  quantity: Math.min(item.quantity, sizeObj.countInStock),
                  // Keep original price for price change detection
                }
              } catch (error) {
                console.error(`Error refreshing item ${item.name}:`, error)
                return item // Keep original item if refresh fails
              }
            })
          )

          // Filter out null items (removed products) and items with 0 quantity
          const filteredItems = updatedItems
            .filter((item): item is OrderItem => item !== null)
            .filter((item) => item.quantity > 0)

          const { shippingAddress } = get().cart

          set({
            cart: {
              ...get().cart,
              items: filteredItems,
              ...(await calcDeliveryDateAndPrice({
                items: filteredItems,
                shippingAddress,
              })),
            },
          })

          // Notify about removed items
          const removedCount = items.length - filteredItems.length
          if (removedCount > 0) {
            console.info(
              `${removedCount} item(s) removed from cart due to availability changes`
            )
          }
        } catch (error) {
          console.error('Error refreshing cart stock:', error)
        }
      },
      refreshCartPrices: async () => {
        const { items, shippingAddress } = get().cart
        const priceChanges: Array<{
          item: OrderItem
          oldPrice: number
          newPrice: number
          priceChange: number
          changeType: 'increase' | 'decrease'
        }> = []

        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.product}`)
              if (!response.ok) {
                // If the product is not found, keep original item
                return item
              }
              const data = await response.json()

              // Calculate current effective price (considering discounts)
              const newBasePrice = data.price
              const newDiscountedPrice = data.discountedPrice
              const newEffectivePrice = newDiscountedPrice ?? newBasePrice

              // Calculate old effective price from cart item
              const oldBasePrice = item.price
              const oldDiscountedPrice = item.discountedPrice
              const oldEffectivePrice = oldDiscountedPrice ?? oldBasePrice

              // Check if the effective price has changed (this includes discount changes)
              if (newEffectivePrice !== oldEffectivePrice) {
                const changeAmount = newEffectivePrice - oldEffectivePrice
                priceChanges.push({
                  item,
                  oldPrice: oldEffectivePrice,
                  newPrice: newEffectivePrice,
                  priceChange: Math.abs(changeAmount),
                  changeType: changeAmount > 0 ? 'increase' : 'decrease',
                })
              }

              // Update stock information as well
              const colorObj = data.colors.find(
                (c: { color: string }) => c.color === item.color
              )
              const sizeObj = colorObj?.sizes.find(
                (s: { size: string; countInStock: number }) =>
                  s.size === item.size
              )

              return {
                ...item,
                price: newBasePrice, // Update base price
                discountedPrice: newDiscountedPrice, // Update discounted price
                discount: data.discount, // Update discount percentage
                colors: data.colors,
                quantity: Math.min(item.quantity, sizeObj?.countInStock || 0),
              }
            } catch {
              // Handle fetch errors by keeping original item
              return item
            }
          })
        )

        // Update cart with new prices
        if (priceChanges.length > 0) {
          set({
            cart: {
              ...get().cart,
              items: updatedItems,
              ...(await calcDeliveryDateAndPrice({
                items: updatedItems,
                shippingAddress,
              })),
            },
          })
        }

        return {
          hasChanges: priceChanges.length > 0,
          priceChanges,
        }
      },
      init: () => set({ cart: initialState }),
    }),

    {
      name: 'cart-store',
    }
  )
)
export default useCartStore
