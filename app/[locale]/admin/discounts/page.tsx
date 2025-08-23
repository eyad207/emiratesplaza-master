'use client'

import React, { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getAllProductsForAdmin,
  applyDiscountToProducts,
  removeDiscountFromProducts,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { round2 } from '@/lib/utils'
import { formatPrice, currencyManager } from '@/lib/currency'
import useSettingStore from '@/hooks/use-setting-store'

export default function DiscountsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [discountedPrices, setDiscountedPrices] = useState<
    Record<string, number>
  >({})
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<{ name: string; _id: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { getCurrency, setting } = useSettingStore()
  const currency = getCurrency()

  // Initialize currency manager
  React.useEffect(() => {
    if (
      setting?.availableCurrencies &&
      setting.availableCurrencies.length > 0
    ) {
      currencyManager.init(setting.availableCurrencies, currency.code)
    }
  }, [setting?.availableCurrencies, currency.code])

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const response = await getAllProductsForAdmin({ query: searchQuery })
        setProducts(response.products)
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch products',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [searchQuery])

  // Fetch categories and tags
  useEffect(() => {
    async function fetchCategoriesAndTags() {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
        ])
        const categoriesData = await categoriesResponse.json()
        const tagsData = await tagsResponse.json()

        if (categoriesData.success) setCategories(categoriesData.categories)
        if (tagsData.success) setTags(tagsData.tags)
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch categories or tags',
          variant: 'destructive',
        })
      }
    }
    fetchCategoriesAndTags()
  }, [])

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const applyDiscount = async () => {
    if (
      discount <= 0 ||
      (!selectedProducts.length && !selectedCategory && !selectedTag)
    ) {
      toast({
        title: 'Warning',
        description:
          'Please select products, a category, or a tag and enter a valid discount.',
        variant: 'default',
      })
      return
    }

    setLoading(true)
    try {
      if (!selectedProducts.length) {
        toast({
          title: 'Warning',
          description: 'Please select products to apply the discount.',
          variant: 'default',
        })
        setLoading(false)
        return
      }

      await applyDiscountToProducts({
        productIds: selectedProducts,
        discount,
      })
      toast({
        title: 'Success',
        description: 'Discount applied successfully!',
        variant: 'default',
      })

      // Update discounted prices locally
      const updatedPrices = { ...discountedPrices }
      selectedProducts.forEach((productId) => {
        const product = products.find((p) => p._id === productId)
        if (product) {
          updatedPrices[productId] =
            product.price - (product.price * discount) / 100
        }
      })
      setDiscountedPrices(updatedPrices)

      setSelectedProducts([])
      setSelectedCategory(null)
      setSelectedTag(null)
      setDiscount(0)

      // Refresh products to reflect updated discounts
      const response = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(response.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to apply discount',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyDiscountToCategory = async () => {
    if (!selectedCategory || discount <= 0) {
      toast({
        title: 'Warning',
        description: 'Please select a category and enter a valid discount.',
        variant: 'default',
      })
      return
    }
    setLoading(true)
    try {
      await applyDiscountToProducts({
        discount,
        category: selectedCategory,
      })
      toast({
        title: 'Success',
        description: 'Discount applied to category successfully!',
        variant: 'default',
      })
      setSelectedProducts([])
      setSelectedCategory(null)
      setDiscount(0)
      const response = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(response.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to apply discount to category',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyDiscountToTag = async () => {
    if (!selectedTag || discount <= 0) {
      toast({
        title: 'Warning',
        description: 'Please select a tag and enter a valid discount.',
        variant: 'default',
      })
      return
    }
    setLoading(true)
    try {
      await applyDiscountToProducts({
        discount,
        tagId: selectedTag,
      })
      toast({
        title: 'Success',
        description: 'Discount applied to tag successfully!',
        variant: 'default',
      })
      setSelectedProducts([])
      setSelectedTag(null)
      setDiscount(0)
      const response = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(response.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to apply discount to tag',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select products to remove the discount.',
        variant: 'default',
      })
      return
    }

    setLoading(true)
    try {
      await removeDiscountFromProducts({ productIds: selectedProducts })
      toast({
        title: 'Success',
        description: 'Discount removed successfully!',
        variant: 'default',
      })

      // Remove discounts locally
      const updatedDiscounts = { ...discountedPrices }
      selectedProducts.forEach((productId) => {
        delete updatedDiscounts[productId]
      })
      setDiscountedPrices(updatedDiscounts)

      setSelectedProducts([])

      // Refresh products to reflect updated discounts
      const response = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(response.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove discount',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeDiscountFromCategory = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Warning',
        description: 'Please select a category to remove the discount.',
        variant: 'default',
      })
      return
    }
    setLoading(true)
    try {
      // Get all products in the selected category
      const response = await getAllProductsForAdmin({
        query: '',
        sort: 'latest',
        page: 1,
        limit: 1000,
      })
      const categoryProducts = response.products.filter(
        (product) => product.category === selectedCategory
      )
      const productIds = categoryProducts.map((p) => p._id)
      if (productIds.length === 0) {
        toast({
          title: 'Info',
          description: 'No products found in this category.',
          variant: 'default',
        })
        setLoading(false)
        return
      }
      await removeDiscountFromProducts({ productIds })
      toast({
        title: 'Success',
        description: 'Discount removed from category successfully!',
        variant: 'default',
      })
      setSelectedProducts([])
      setSelectedCategory(null)
      setDiscount(0)
      const refreshed = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(refreshed.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove discount from category',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeDiscountFromTag = async () => {
    if (!selectedTag) {
      toast({
        title: 'Warning',
        description: 'Please select a tag to remove the discount.',
        variant: 'default',
      })
      return
    }
    setLoading(true)
    try {
      // Get all products with the selected tag
      const response = await getAllProductsForAdmin({
        query: '',
        sort: 'latest',
        page: 1,
        limit: 1000,
      })
      const tagProducts = response.products.filter(
        (product) =>
          Array.isArray(product.tags) &&
          product.tags.some((tag: string | { _id: string }) =>
            typeof tag === 'string'
              ? tag === selectedTag
              : tag?._id === selectedTag
          )
      )
      const productIds = tagProducts.map((p) => p._id)
      if (productIds.length === 0) {
        toast({
          title: 'Info',
          description: 'No products found with this tag.',
          variant: 'default',
        })
        setLoading(false)
        return
      }
      await removeDiscountFromProducts({ productIds })
      toast({
        title: 'Success',
        description: 'Discount removed from tag successfully!',
        variant: 'default',
      })
      setSelectedProducts([])
      setSelectedTag(null)
      setDiscount(0)
      const refreshed = await getAllProductsForAdmin({ query: searchQuery })
      setProducts(refreshed.products)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove discount from tag',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6'>
        <h1 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100'>
          Manage Discounts
        </h1>

        {/* Search Section */}
        <div className='mb-4'>
          <Input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search products by name'
            className='w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          />
        </div>

        {/* Products Table */}
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Price After Discount</TableHead>
                <TableHead>Discount Amount</TableHead>
                <TableHead>Discount Percentage</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                // Calculate discounted price:
                const productDiscountedPrice =
                  discountedPrices[product._id] !== undefined
                    ? discountedPrices[product._id]
                    : product.discount
                      ? round2(product.price * (1 - product.discount / 100))
                      : undefined

                return (
                  <TableRow
                    key={product._id}
                    className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product._id)}
                        onCheckedChange={() =>
                          toggleProductSelection(product._id)
                        }
                      />
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      {productDiscountedPrice !== undefined
                        ? formatPrice(productDiscountedPrice)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {productDiscountedPrice !== undefined
                        ? formatPrice(product.price - productDiscountedPrice)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {productDiscountedPrice !== undefined
                        ? `${(
                            ((product.price - productDiscountedPrice) /
                              product.price) *
                            100
                          ).toFixed(2)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                  </TableRow>
                )
              })}
              {products.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className='text-center'>
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Discount Section */}
        <div className='mt-4 flex flex-col sm:flex-row items-center gap-4'>
          <div className='w-full sm:w-1/3'>
            <Input
              type='number'
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder='Enter discount percentage'
              className='w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            />
          </div>
          <div className='w-full sm:w-1/3'>
            {/* Dropdown for selecting category */}
            <label className='block text-gray-700 dark:text-gray-300 mb-2'>
              Select Category
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            >
              <option value='' disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className='w-full sm:w-1/3'>
            {/* Dropdown for selecting tag */}
            <label className='block text-gray-700 dark:text-gray-300 mb-2'>
              Select Tag
            </label>
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value)}
              className='w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            >
              <option value='' disabled>
                Select a tag
              </option>
              {tags.map((tag) => (
                <option key={tag._id} value={tag._id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='mt-4 flex items-center gap-4 flex-wrap'>
          <Button
            onClick={applyDiscount}
            disabled={loading || discount <= 0 || selectedProducts.length === 0}
            className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Applying...' : 'Apply Discount to Selected Products'}
          </Button>
          <Button
            onClick={applyDiscountToCategory}
            disabled={loading || discount <= 0 || !selectedCategory}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Applying...' : 'Apply Discount to Category'}
          </Button>
          <Button
            onClick={applyDiscountToTag}
            disabled={loading || discount <= 0 || !selectedTag}
            className='bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Applying...' : 'Apply Discount to Tag'}
          </Button>
          <Button
            onClick={removeDiscount}
            disabled={loading || selectedProducts.length === 0}
            className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Removing...' : 'Remove Discount from Selected'}
          </Button>
          <Button
            onClick={removeDiscountFromCategory}
            disabled={loading || !selectedCategory}
            className='bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 dark:hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Removing...' : 'Remove Discount from Category'}
          </Button>
          <Button
            onClick={removeDiscountFromTag}
            disabled={loading || !selectedTag}
            className='bg-red-900 text-white px-4 py-2 rounded-md hover:bg-red-950 dark:hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Removing...' : 'Remove Discount from Tag'}
          </Button>
        </div>
      </div>
    </div>
  )
}
