/**
 * Centralized Currency and Price Management System
 *
 * This module provides a unified way to handle currency conversion and price formatting
 * across the entire application. All prices are stored in NOK (base currency) and
 * converted to display currency when needed.
 */

import { SiteCurrency } from '@/types'

// Base currency (all prices are stored in this currency)
export const BASE_CURRENCY = 'NOK'

// Default currency settings
export const DEFAULT_CURRENCY: SiteCurrency = {
  name: 'Norwegian Krone',
  code: 'NOK',
  symbol: 'kr',
  convertRate: 1, // Base currency always has rate 1
}

/**
 * Currency conversion utilities
 */
export class CurrencyManager {
  private static instance: CurrencyManager
  private availableCurrencies: SiteCurrency[] = []
  private currentCurrency: SiteCurrency = DEFAULT_CURRENCY

  private constructor() {}

  static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager()
    }
    return CurrencyManager.instance
  }

  /**
   * Initialize the currency manager with available currencies
   */
  init(currencies: SiteCurrency[], currentCurrencyCode: string) {
    this.availableCurrencies = currencies
    this.setCurrentCurrency(currentCurrencyCode)
  }

  /**
   * Set the current display currency
   */
  setCurrentCurrency(currencyCode: string) {
    const currency = this.availableCurrencies.find(
      (c) => c.code === currencyCode
    )
    if (currency) {
      this.currentCurrency = currency
    } else {
      console.warn(`Currency ${currencyCode} not found, using default`)
      this.currentCurrency = DEFAULT_CURRENCY
    }
  }

  /**
   * Get the current display currency
   */
  getCurrentCurrency(): SiteCurrency {
    return this.currentCurrency
  }

  /**
   * Get all available currencies
   */
  getAvailableCurrencies(): SiteCurrency[] {
    return this.availableCurrencies
  }

  /**
   * Convert price from base currency (NOK) to current display currency
   */
  convertPrice(priceInNOK: number): number {
    return this.round(priceInNOK * this.currentCurrency.convertRate)
  }

  /**
   * Convert price from base currency (NOK) to specific currency
   */
  convertPriceTo(priceInNOK: number, currencyCode: string): number {
    const currency = this.availableCurrencies.find(
      (c) => c.code === currencyCode
    )
    if (!currency) {
      console.warn(`Currency ${currencyCode} not found, using current currency`)
      return this.convertPrice(priceInNOK)
    }
    return this.round(priceInNOK * currency.convertRate)
  }

  /**
   * Convert price from display currency back to base currency (NOK)
   */
  convertToBaseCurrency(price: number, fromCurrencyCode?: string): number {
    const currency = fromCurrencyCode
      ? this.availableCurrencies.find((c) => c.code === fromCurrencyCode)
      : this.currentCurrency

    if (!currency) {
      console.warn(`Currency not found, using current currency`)
      return this.round(price / this.currentCurrency.convertRate)
    }

    return this.round(price / currency.convertRate)
  }

  /**
   * Format price for display with proper currency symbol and formatting
   */
  formatPrice(
    priceInNOK: number,
    options?: {
      currency?: string
      showSymbol?: boolean
      locale?: string
    }
  ): string {
    const currency = options?.currency
      ? this.availableCurrencies.find((c) => c.code === options.currency) ||
        this.currentCurrency
      : this.currentCurrency

    const convertedPrice = this.round(priceInNOK * currency.convertRate)
    const locale = options?.locale || 'nb-NO'

    if (options?.showSymbol === false) {
      return new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedPrice)
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'symbol',
    }).format(convertedPrice)
  }

  /**
   * Get formatted price parts for custom display
   */
  getPriceParts(
    priceInNOK: number,
    currencyCode?: string
  ): {
    currency: SiteCurrency
    convertedPrice: number
    integerPart: string
    decimalPart: string
    formattedPrice: string
  } {
    const currency = currencyCode
      ? this.availableCurrencies.find((c) => c.code === currencyCode) ||
        this.currentCurrency
      : this.currentCurrency

    const convertedPrice = this.round(priceInNOK * currency.convertRate)
    const formattedPrice = this.formatPrice(priceInNOK, {
      currency: currency.code,
    })

    const [integerPart, decimalPart = '00'] = convertedPrice
      .toFixed(2)
      .split('.')

    return {
      currency,
      convertedPrice,
      integerPart,
      decimalPart,
      formattedPrice,
    }
  }

  /**
   * Round to 2 decimal places
   */
  private round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }
}

// Export a singleton instance
export const currencyManager = CurrencyManager.getInstance()

/**
 * Convenience functions for common operations
 */

/**
 * Format price for display (most common use case)
 */
export function formatPrice(priceInNOK: number, currencyCode?: string): string {
  return currencyManager.formatPrice(priceInNOK, { currency: currencyCode })
}

/**
 * Convert price to current display currency
 */
export function convertPrice(priceInNOK: number): number {
  return currencyManager.convertPrice(priceInNOK)
}

/**
 * Get price parts for custom formatting
 */
export function getPriceParts(priceInNOK: number, currencyCode?: string) {
  return currencyManager.getPriceParts(priceInNOK, currencyCode)
}

/**
 * Convert price from display currency to NOK
 */
export function convertToNOK(price: number, fromCurrencyCode?: string): number {
  return currencyManager.convertToBaseCurrency(price, fromCurrencyCode)
}
