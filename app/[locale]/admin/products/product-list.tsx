'use client'
import Link from 'next/link'

import DeleteDialog from '@/components/shared/delete-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  deleteProduct,
  getAllProductsForAdmin,
  getAllCategories,
  updateStockForProducts,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { formatPrice } from '@/lib/currency'

import React, { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatId } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Package,
  Edit3,
  Eye,
  ArrowUpDown,
  CheckSquare,
  Square,
  RefreshCw,
  Package2,
} from 'lucide-react'

type ProductListDataProps = {
  products: IProduct[]
  totalPages: number
  totalProducts: number
  to: number
  from: number
}

const getTotalCountInStock = (product: IProduct) => {
  return product.colors.reduce((total, color) => {
    return (
      total +
      color.sizes.reduce((sizeTotal, size) => sizeTotal + size.countInStock, 0)
    )
  }, 0)
}

const ProductList = () => {
  const [page, setPage] = useState<number>(1)
  const [inputValue, setInputValue] = useState<string>('')
  const [data, setData] = useState<ProductListDataProps>()
  const [, startTransition] = useTransition()
  const [sortField, setSortField] = useState<string>('') // Field to sort by
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc') // Sort order
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [bulkQuantity, setBulkQuantity] = useState<number>(1)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isAllChecked, setIsAllChecked] = useState<boolean>(false) // State to track "Check/Uncheck All"

  const handlePageChange = (changeType: 'next' | 'prev') => {
    const newPage = changeType === 'next' ? page + 1 : page - 1
    setPage(newPage)
    fetchProducts(inputValue, newPage, selectedCategory)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    fetchProducts(value, 1, selectedCategory)
  }

  const handleSort = (field: string) => {
    const newSortOrder =
      sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newSortOrder)
    fetchProducts(
      inputValue,
      page,
      selectedCategory,
      `${field}-${newSortOrder}`
    )
  }

  const handleCheckboxChange = (productId: string, isChecked: boolean) => {
    setSelectedProducts((prev) =>
      isChecked ? [...prev, productId] : prev.filter((id) => id !== productId)
    )
  }

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category)
    startTransition(async () => {
      const data = await getAllProductsForAdmin({
        query: inputValue,
        page: 1,
        category,
      })
      setData(data)

      // Automatically select all products in the selected category
      const productIds = data.products.map((product) => product._id)
      setSelectedProducts(productIds)
    })
  }

  const handleUpdateQuantities = async () => {
    if (selectedProducts.length === 0) return
    await updateStockForProducts({
      productIds: selectedProducts,
      quantity: bulkQuantity,
    })
    fetchProducts(inputValue, page, selectedCategory)
    setSelectedProducts([]) // Clear selection after update
    setBulkQuantity(1) // Reset bulk quantity
  }

  const handleToggleAll = () => {
    if (isAllChecked) {
      setSelectedProducts([]) // Uncheck all
    } else {
      const allProductIds = data?.products.map((product) => product._id) || []
      setSelectedProducts(allProductIds) // Check all
    }
    setIsAllChecked(!isAllChecked) // Toggle the state
  }

  const fetchProducts = async (
    query: string,
    page: number,
    category: string,
    sort?: string
  ) => {
    startTransition(async () => {
      const data = await getAllProductsForAdmin({
        query,
        page,
        sort,
        category,
      })
      setData(data)
    })
  }

  useEffect(() => {
    startTransition(async () => {
      const data = await getAllProductsForAdmin({ query: '' })
      setData(data)
      const categories = await getAllCategories()
      setCategories(categories)
    })
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
      <div className='container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl'>
        {/* Header Section */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Package2 className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100'>
              Product Management
            </h1>
          </div>
          <p className='text-sm sm:text-base text-slate-600 dark:text-slate-400'>
            Manage your product inventory, pricing, and availability
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8'>
          <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                    Total Products
                  </p>
                  <p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                    {data?.totalProducts || 0}
                  </p>
                </div>
                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full'>
                  <Package className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                    Categories
                  </p>
                  <p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                    {categories.length}
                  </p>
                </div>
                <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-full'>
                  <Filter className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                    Selected Items
                  </p>
                  <p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                    {selectedProducts.length}
                  </p>
                </div>
                <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full'>
                  <CheckSquare className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Section */}
        <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50 mb-6'>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex flex-col space-y-4'>
              {/* Search and Filter Row */}
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    className='pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                    type='text'
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder='Search products...'
                  />
                </div>
                <div className='relative w-full sm:w-auto'>
                  <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none' />
                  <select
                    className='w-full sm:w-auto pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none min-w-[160px]'
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value=''>All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions Row */}
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
                <div className='flex flex-col xs:flex-row items-start xs:items-center gap-3 w-full sm:w-auto'>
                  <div className='flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg p-2 w-full xs:w-auto'>
                    <Input
                      type='number'
                      min='1'
                      value={bulkQuantity}
                      onChange={(e) =>
                        setBulkQuantity(parseInt(e.target.value, 10))
                      }
                      placeholder='Qty'
                      className='w-16 xs:w-20 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                    />
                    <Button
                      size='sm'
                      onClick={handleUpdateQuantities}
                      disabled={selectedProducts.length === 0}
                      className='bg-primary hover:bg-primary/90 text-xs sm:text-sm'
                    >
                      <RefreshCw className='h-4 w-4 mr-1' />
                      <span className='hidden xs:inline'>Update Stock</span>
                      <span className='xs:hidden'>Update</span>
                    </Button>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleToggleAll}
                    className='border-slate-200 dark:border-slate-600 w-full xs:w-auto'
                  >
                    {isAllChecked ? (
                      <CheckSquare className='h-4 w-4 mr-2' />
                    ) : (
                      <Square className='h-4 w-4 mr-2' />
                    )}
                    <span className='hidden xs:inline'>
                      {isAllChecked ? 'Uncheck All' : 'Check All'}
                    </span>
                    <span className='xs:hidden'>
                      {isAllChecked ? 'Uncheck' : 'Check All'}
                    </span>
                  </Button>
                </div>

                <Button
                  asChild
                  className='bg-primary hover:bg-primary/90 w-full xs:w-auto'
                >
                  <Link href='/admin/products/create'>
                    <Plus className='h-4 w-4 mr-2' />
                    <span className='hidden xs:inline'>Add Product</span>
                    <span className='xs:hidden'>Add</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Products Table */}
        <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50'>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-b border-slate-200 dark:border-slate-700'>
                    <TableHead className='w-12 px-3 sm:px-6 py-4'>
                      <div className='flex items-center'>
                        {isAllChecked ? (
                          <CheckSquare className='h-4 w-4 text-primary' />
                        ) : (
                          <Square className='h-4 w-4 text-slate-400' />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('_id')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors hidden sm:table-cell'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='hidden lg:inline'>ID</span>
                        <span className='lg:hidden'>ID</span>
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === '_id' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('name')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors'
                    >
                      <div className='flex items-center gap-2'>
                        Product
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === 'name' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('price')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors'
                    >
                      <div className='flex items-center gap-2'>
                        Price
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === 'price' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('category')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors hidden md:table-cell'
                    >
                      <div className='flex items-center gap-2'>
                        Category
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === 'category' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('stock')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors hidden lg:table-cell'
                    >
                      <div className='flex items-center gap-2'>
                        Stock
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === 'stock' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('updatedAt')}
                      className='cursor-pointer px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors hidden xl:table-cell'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='hidden xl:inline'>Last Updated</span>
                        <span className='xl:hidden'>Updated</span>
                        <ArrowUpDown className='h-3 w-3' />
                        {sortField === 'updatedAt' && (
                          <span className='text-primary'>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className='px-3 sm:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.products.map((product: IProduct, index) => (
                    <TableRow
                      key={product._id}
                      className={`
                        border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                        ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}
                      `}
                    >
                      <TableCell className='px-3 sm:px-6 py-4'>
                        <input
                          type='checkbox'
                          checked={selectedProducts.includes(product._id)}
                          onChange={(e) =>
                            handleCheckboxChange(product._id, e.target.checked)
                          }
                          className='w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary'
                        />
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4 hidden sm:table-cell'>
                        <div className='font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                          {formatId(product._id)}
                        </div>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4'>
                        <Link
                          href={`/admin/products/${product._id}`}
                          className='flex items-center gap-2 sm:gap-3 group'
                        >
                          <div className='w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors'>
                            <Package className='h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors truncate'>
                              {product.name}
                            </div>
                            <div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate'>
                              {product.slug}
                            </div>
                            {/* Show additional info on mobile */}
                            <div className='sm:hidden mt-1 space-y-1'>
                              <div className='text-xs text-slate-600 dark:text-slate-400'>
                                ID: {formatId(product._id)}
                              </div>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant='secondary'
                                  className='bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0 text-xs'
                                >
                                  {product.category}
                                </Badge>
                                <div className='text-xs text-slate-600 dark:text-slate-400'>
                                  Stock: {getTotalCountInStock(product)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4'>
                        <div>
                          <div className='font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100'>
                            {formatPrice(product.price)}
                          </div>
                          {product.discountedPrice && (
                            <div className='text-xs sm:text-sm text-green-600 dark:text-green-400'>
                              Sale: {formatPrice(product.discountedPrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4 hidden md:table-cell'>
                        <Badge
                          variant='secondary'
                          className='bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0'
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4 hidden lg:table-cell'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              getTotalCountInStock(product) > 10
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : getTotalCountInStock(product) > 0
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }
                          `}
                          >
                            {getTotalCountInStock(product)} units
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4 hidden xl:table-cell'>
                        <div className='text-sm text-slate-600 dark:text-slate-400'>
                          {formatDateTime(product.updatedAt).dateTime}
                        </div>
                      </TableCell>
                      <TableCell className='px-3 sm:px-6 py-4'>
                        <div className='flex items-center gap-1 sm:gap-2'>
                          <Button
                            asChild
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          >
                            <Link href={`/admin/products/${product._id}`}>
                              <Edit3 className='h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400' />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20'
                          >
                            <Link
                              target='_blank'
                              href={`/product/${product.slug}`}
                            >
                              <Eye className='h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400' />
                            </Link>
                          </Button>
                          <DeleteDialog
                            id={product._id}
                            action={deleteProduct}
                            callbackAction={() =>
                              fetchProducts(inputValue, page, selectedCategory)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {/* Pagination */}
        {(data?.totalPages ?? 0) > 1 && (
          <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50 mt-6'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                <div className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left'>
                  Showing {data?.from} to {data?.to} of {data?.totalProducts}{' '}
                  products
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange('prev')}
                    disabled={Number(page) <= 1}
                    className='border-slate-200 dark:border-slate-600 text-xs sm:text-sm'
                  >
                    <ChevronLeft className='w-3 h-3 sm:w-4 sm:h-4' />
                    <span className='hidden xs:inline'>Previous</span>
                    <span className='xs:hidden'>Prev</span>
                  </Button>

                  <div className='flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300'>
                    <span className='hidden xs:inline'>Page</span> {page}{' '}
                    <span className='hidden xs:inline'>of</span>
                    <span className='xs:hidden'>/</span> {data?.totalPages}
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange('next')}
                    disabled={Number(page) >= (data?.totalPages ?? 0)}
                    className='border-slate-200 dark:border-slate-600 text-xs sm:text-sm'
                  >
                    <span className='hidden xs:inline'>Next</span>
                    <span className='xs:hidden'>Next</span>
                    <ChevronRight className='w-3 h-3 sm:w-4 sm:h-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {data?.products.length === 0 && (
          <Card className='bg-white dark:bg-slate-800 shadow-sm border-0 shadow-slate-200/50 dark:shadow-slate-800/50'>
            <CardContent className='p-12 text-center'>
              <div className='flex flex-col items-center gap-4'>
                <div className='p-4 bg-slate-100 dark:bg-slate-700 rounded-full'>
                  <Package className='h-8 w-8 text-slate-400' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2'>
                    No products found
                  </h3>
                  <p className='text-slate-600 dark:text-slate-400 mb-4'>
                    {inputValue || selectedCategory
                      ? 'Try adjusting your search criteria or filters.'
                      : 'Get started by creating your first product.'}
                  </p>
                  {!inputValue && !selectedCategory && (
                    <Button asChild className='bg-primary hover:bg-primary/90'>
                      <Link href='/admin/products/create'>
                        <Plus className='h-4 w-4 mr-2' />
                        Create Your First Product
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProductList
