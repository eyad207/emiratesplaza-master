'use client'
import React, { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function TagsPage() {
  const [tags, setTags] = useState<{ name: string; _id: string }[]>([])
  const [products, setProducts] = useState<{ name: string; _id: string }[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  useEffect(() => {
    async function fetchTags() {
      setLoading(true)
      try {
        const response = await fetch('/api/tags')
        const data = await response.json()
        if (data.success && Array.isArray(data.tags)) {
          setTags(data.tags)
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch tags',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Error fetching tags',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/products?query=${searchQuery}&page=${page}&limit=15`
        )
        const data = await response.json()
        if (data.success && Array.isArray(data.products)) {
          setProducts((prev) =>
            page === 1 ? data.products : [...prev, ...data.products]
          )
          setTotalProducts(data.totalProducts)

          // Pre-select products if a tag is selected
          if (selectedTag) {
            const tagResponse = await fetch(`/api/products?tag=${selectedTag}`)
            const tagData = await tagResponse.json()
            if (tagData.success && Array.isArray(tagData.products)) {
              const productIdsInTag: string[] = tagData.products.map(
                (p: { _id: string }) => p._id
              )
              setSelectedProducts(productIdsInTag)
            }
          }
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch products',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Error fetching products',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [searchQuery, page, selectedTag])

  const handleTagSelection = (tagId: string) => {
    setSelectedTag(tagId)
    setPage(1) // Reset to the first page when a tag is selected
  }

  const addTag = async () => {
    if (newTag.trim()) {
      setLoading(true)
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTag }),
        })
        const data = await response.json()
        if (data.success) {
          setTags((prev) => [...prev, { name: newTag, _id: data._id }])
          setNewTag('')
          toast({
            title: 'Success',
            description: 'Tag added successfully',
            variant: 'default',
          })
        } else {
          toast({
            title: 'Error',
            description: data.message,
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Error adding tag',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const deleteTag = async (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      setLoading(true)
      try {
        const response = await fetch(`/api/tags?id=${tagId}`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          setTags((prev) => prev.filter((t) => t._id !== tagId))
          toast({
            title: 'Success',
            description: 'Tag deleted successfully',
            variant: 'default',
          })
        } else {
          toast({
            title: 'Error',
            description: data.message,
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Error deleting tag',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const assignProductsToTag = async () => {
    if (!selectedTag || selectedProducts.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select a tag and at least one product.',
        variant: 'default',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tags/assign-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: selectedTag,
          productIds: selectedProducts,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to assign products to tag')
      }

      const data = await response.json()
      toast({ title: 'Success', description: data.message, variant: 'default' })
      setSelectedProducts([])
      setSelectedTag(null)
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const removeProductsFromTag = async () => {
    if (!selectedTag || selectedProducts.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select a tag and at least one product.',
        variant: 'default',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tags/remove-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: selectedTag,
          productIds: selectedProducts,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || 'Failed to remove products from tag'
        )
      }

      const data = await response.json()
      toast({ title: 'Success', description: data.message, variant: 'default' })
      setSelectedProducts([])
      setSelectedTag(null)
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <div className='p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6'>
        <h1 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100'>
          Manage Tags
        </h1>

        {/* Add Tag Section */}
        <div className='flex flex-col sm:flex-row items-center gap-4 mb-4 sm:mb-6'>
          <input
            type='text'
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder='Enter a new tag'
            className='flex-1 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          />
          <button
            onClick={addTag}
            disabled={loading}
            className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto'
          >
            {loading ? 'Adding...' : 'Add Tag'}
          </button>
        </div>

        {/* Tags Table */}
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse border border-gray-300 dark:border-gray-700 mb-4 sm:mb-6'>
            <thead className='bg-gray-100 dark:bg-gray-800'>
              <tr>
                <th className='border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left text-gray-700 dark:text-gray-300'>
                  Tag Name
                </th>
                <th className='border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-left text-gray-700 dark:text-gray-300'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr
                  key={tag._id}
                  className='hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                >
                  <td
                    className='border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-gray-900 dark:text-gray-100 cursor-pointer'
                    onClick={() => handleTagSelection(tag._id)}
                  >
                    {tag.name}
                  </td>
                  <td className='border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2'>
                    <button
                      onClick={() => deleteTag(tag._id)}
                      className='text-red-600 hover:underline dark:text-red-400'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={2}
                    className='border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 text-center text-gray-500 dark:text-gray-400'
                  >
                    No tags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Search and Products */}
        <div className='mb-4 sm:mb-6'>
          <h2 className='text-lg font-bold mb-4 text-gray-900 dark:text-gray-100'>
            Assign Products to Tag
          </h2>
          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300 mb-2'>
              Search Products
            </label>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1) // Reset to the first page when searching
              }}
              placeholder='Search products by name'
              className='w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            />
          </div>

          <div className='mb-4'>
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

          <div className='mb-4'>
            <label className='block text-gray-700 dark:text-gray-300 mb-2'>
              Select Products
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {products.map((product) => (
                <div key={product._id} className='flex items-center'>
                  <input
                    type='checkbox'
                    id={product._id}
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => toggleProductSelection(product._id)}
                    className='mr-2'
                  />
                  <label
                    htmlFor={product._id}
                    className='text-gray-900 dark:text-gray-100'
                  >
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {products.length < totalProducts && (
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500 transition w-full sm:w-auto'
            >
              Show More
            </button>
          )}

          <button
            onClick={assignProductsToTag}
            disabled={loading || !selectedTag || selectedProducts.length === 0}
            className='bg-green-600 text-white ml-4 px-6 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4'
          >
            {loading ? 'Assigning...' : 'Assign Products'}
          </button>
          <button
            onClick={removeProductsFromTag}
            disabled={loading || !selectedTag || selectedProducts.length === 0}
            className='bg-red-600 text-white ml-4 px-6 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4'
          >
            {loading ? 'Removing...' : 'Remove Products'}
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className='text-center text-gray-500 dark:text-gray-400 mt-4'>
            Loading...
          </div>
        )}
      </div>
    </div>
  )
}
