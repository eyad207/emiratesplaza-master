import Link from 'next/link'
import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  getAllProducts,
  getAllCategoriesWithTranslation,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import { getFilterUrl } from '@/lib/utils'
import Rating from '@/components/shared/product/rating'
import CollapsibleOnMobile from '@/components/shared/collapsible-on-mobile'
import { getTranslations } from 'next-intl/server'
import { detectAndCorrectSpelling } from '@/lib/multilingual-search'
import {
  SearchIcon,
  FilterIcon,
  SortAscIcon,
  X,
  LayoutGridIcon,
  SlidersHorizontalIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from 'lucide-react'

const sortOrders = [
  { value: 'price-low-to-high', name: 'Price: Low to high' },
  { value: 'price-high-to-low', name: 'Price: High to low' },
  { value: 'newest-arrivals', name: 'Newest arrivals' },
  { value: 'avg-customer-review', name: 'Avg. customer review' },
  { value: 'best-selling', name: 'Best selling' },
]

const prices = [
  {
    name: 'Kr 10 to Kr 200',
    value: '1-20',
  },
  {
    name: 'Kr 210 to Kr 500',
    value: '21-50',
  },
  {
    name: 'Kr 510 to Kr 10000',
    value: '51-1000',
  },
]

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
}) {
  const searchParams = await props.searchParams
  const t = await getTranslations()
  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
  } = searchParams

  if (
    (q !== 'all' && q !== '') ||
    category !== 'all' ||
    tag !== 'all' ||
    rating !== 'all' ||
    price !== 'all'
  ) {
    return {
      title: `${t('Search.Search')} ${q !== 'all' ? q : ''}
          ${category !== 'all' ? ` : ${t('Search.Category')} ${category}` : ''}
          ${tag !== 'all' ? ` : ${t('Search.Tag')} ${tag}` : ''}
          ${price !== 'all' ? ` : ${t('Search.Price')} ${price}` : ''}
          ${rating !== 'all' ? ` : ${t('Search.Rating')} ${rating}` : ''}`,
    }
  } else {
    return {
      title: t('Search.Search Products'),
    }
  }
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
  params: Promise<{ locale: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  const locale = params.locale as 'ar' | 'en-US' | 'nb-NO'

  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
    sort = 'best-selling',
    page = '1',
  } = searchParams
  const searchParamsObj = { q, category, tag, price, rating, sort, page }
  // Get translated categories for the current locale
  const translatedCategories = await getAllCategoriesWithTranslation(locale)

  // Get spell check for the current query
  const spellCheckResult =
    q && q !== 'all' ? await detectAndCorrectSpelling(q, locale) : null

  // Get products with multilingual search
  const data = await getAllProducts({
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
    locale, // Pass locale for multilingual search
  })
  const t = await getTranslations()

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900'>
      {/* Enhanced Spell Check Suggestion */}
      {spellCheckResult?.isLikelyMisspelled &&
        spellCheckResult.correctedQuery && (
          <div className='bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-b border-blue-200/50 dark:border-blue-700/50'>
            <div className='container mx-auto px-4 py-4'>
              <div className='max-w-6xl mx-auto'>
                <div className='flex items-center gap-4 p-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-blue-200/60 dark:border-blue-700/60 rounded-xl shadow-lg'>
                  <div className='flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg'>
                    <SearchIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      <span className='text-blue-600 dark:text-blue-400 font-semibold'>
                        {t('Search.Did you mean')}
                      </span>
                      {': '}{' '}
                      <Button
                        variant='link'
                        className='p-0 h-auto text-lg font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline-offset-2'
                        asChild
                      >
                        <Link
                          href={`/search?q=${encodeURIComponent(spellCheckResult.correctedQuery)}`}
                          className='text-lg'
                        >
                          {spellCheckResult.correctedQuery}
                        </Link>
                      </Button>
                      <span className='text-blue-600 dark:text-blue-400'>
                        ?
                      </span>
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      Showing results for &quot;{q}&quot; instead
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Main Container */}
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Search Header with Results Summary */}
          <div className='mb-8'>
            <Card className='shadow-lg border-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6'>
                  {/* Results Summary */}
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-primary/10 rounded-lg'>
                        <ShoppingBagIcon className='h-5 w-5 text-primary' />
                      </div>
                      <div>
                        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {data.totalProducts === 0
                            ? t('Search.No products found')
                            : `${data.totalProducts} ${t('Search.products found')}`}
                        </h1>
                        {data.totalProducts > 0 && (
                          <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {t('Search.Showing')} {data.from}-{data.to}{' '}
                            {t('Search.of')} {data.totalProducts}{' '}
                            {t('Search.results')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active Filters */}
                    {((q !== 'all' && q !== '') ||
                      (category !== 'all' && category !== '') ||
                      price !== 'all' ||
                      rating !== 'all') && (
                      <div className='flex flex-wrap gap-2'>
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300 self-center'>
                          {t('Search.Active filters')}:
                        </span>

                        {q !== 'all' && q !== '' && (
                          <Badge
                            variant='default'
                            className='flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors'
                          >
                            <SearchIcon className='h-3 w-3' />
                            &quot;{q}&quot;
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-4 w-4 p-0 hover:bg-primary/20'
                              asChild
                            >
                              <Link
                                href={getFilterUrl({
                                  params: { ...searchParamsObj, q: 'all' },
                                })}
                              >
                                <X className='h-3 w-3' />
                              </Link>
                            </Button>
                          </Badge>
                        )}

                        {category !== 'all' && category !== '' && (
                          <Badge
                            variant='secondary'
                            className='flex items-center gap-2 px-3 py-1'
                          >
                            <FilterIcon className='h-3 w-3' />
                            {category}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-4 w-4 p-0'
                              asChild
                            >
                              <Link
                                href={getFilterUrl({
                                  category: 'all',
                                  params: searchParamsObj,
                                })}
                              >
                                <X className='h-3 w-3' />
                              </Link>
                            </Button>
                          </Badge>
                        )}

                        {price !== 'all' && (
                          <Badge
                            variant='secondary'
                            className='flex items-center gap-2 px-3 py-1'
                          >
                            {t('Search.Price')}: {price}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-4 w-4 p-0'
                              asChild
                            >
                              <Link
                                href={getFilterUrl({
                                  price: 'all',
                                  params: searchParamsObj,
                                })}
                              >
                                <X className='h-3 w-3' />
                              </Link>
                            </Button>
                          </Badge>
                        )}

                        {rating !== 'all' && (
                          <Badge
                            variant='secondary'
                            className='flex items-center gap-2 px-3 py-1'
                          >
                            {rating}+ ⭐
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-4 w-4 p-0'
                              asChild
                            >
                              <Link
                                href={getFilterUrl({
                                  rating: 'all',
                                  params: searchParamsObj,
                                })}
                              >
                                <X className='h-3 w-3' />
                              </Link>
                            </Button>
                          </Badge>
                        )}

                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 text-xs'
                          asChild
                        >
                          <Link
                            href={getFilterUrl({
                              category: 'all',
                              price: 'all',
                              rating: 'all',
                              params: { ...searchParamsObj, q: 'all' },
                            })}
                          >
                            {t('Search.Clear All')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Sort Controls */}
                  <div className='flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 rounded-lg p-3'>
                    <div className='flex items-center gap-2'>
                      <SortAscIcon className='h-4 w-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('Search.Sort by')}:
                      </span>
                    </div>
                    <ProductSortSelector
                      sortOrders={sortOrders}
                      sort={sort}
                      params={searchParamsObj}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Layout */}
          <div className='grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8'>
            {/* Filters Sidebar */}
            <div className='md:col-span-1 lg:col-span-1'>
              <CollapsibleOnMobile title={t('Search.Filters')}>
                <Card className='sticky top-6 shadow-lg border-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm'>
                  <CardContent className='p-4 md:p-6 space-y-4 md:space-y-6'>
                    {/* Filters Header */}
                    <div className='flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700'>
                      <div className='p-2 bg-primary/10 rounded-lg'>
                        <SlidersHorizontalIcon className='h-5 w-5 text-primary' />
                      </div>
                      <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                        {t('Search.Filters')}
                      </h2>
                    </div>

                    {/* Department Filter */}
                    <div className='space-y-4'>
                      <h3 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        <LayoutGridIcon className='h-4 w-4 text-primary' />
                        {t('Search.Department')}
                      </h3>
                      <div className='space-y-2 max-h-48 overflow-y-auto'>
                        <Link
                          className={`flex items-center justify-between p-2 rounded-lg text-xs md:text-sm transition-all duration-200 hover:bg-primary/10 ${
                            'all' === category || '' === category
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                          }`}
                          href={getFilterUrl({
                            category: 'all',
                            params: { ...searchParamsObj, q: 'all' },
                          })}
                        >
                          <span>{t('Search.All')}</span>
                          {('all' === category || '' === category) && (
                            <Badge variant='secondary' className='text-xs'>
                              {data.totalProducts}
                            </Badge>
                          )}
                        </Link>
                        {translatedCategories.map((categoryItem) => (
                          <Link
                            key={categoryItem.original}
                            className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 ${
                              categoryItem.original === category
                                ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                            }`}
                            href={getFilterUrl({
                              category: categoryItem.original,
                              params: { ...searchParamsObj, q: 'all' },
                            })}
                          >
                            <span>{categoryItem.translated}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Separator className='bg-gray-200 dark:bg-gray-700' />

                    {/* Price Filter */}
                    <div className='space-y-4'>
                      <h3 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        <TrendingUpIcon className='h-4 w-4 text-primary' />
                        {t('Search.Price')}
                      </h3>
                      <div className='space-y-2'>
                        <Link
                          className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 ${
                            'all' === price
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                          }`}
                          href={getFilterUrl({
                            price: 'all',
                            params: searchParamsObj,
                          })}
                        >
                          {t('Search.All')}
                        </Link>
                        {prices.map((p) => (
                          <Link
                            key={p.value}
                            className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 ${
                              p.value === price
                                ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                            }`}
                            href={getFilterUrl({
                              price: p.value,
                              params: searchParamsObj,
                            })}
                          >
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Separator className='bg-gray-200 dark:bg-gray-700' />

                    {/* Rating Filter */}
                    <div className='space-y-4'>
                      <h3 className='font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                        ⭐ {t('Search.Customer Review')}
                      </h3>
                      <div className='space-y-2'>
                        <Link
                          className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 ${
                            'all' === rating
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                          }`}
                          href={getFilterUrl({
                            rating: 'all',
                            params: searchParamsObj,
                          })}
                        >
                          {t('Search.All')}
                        </Link>
                        <Link
                          className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200 hover:bg-primary/10 ${
                            '4' === rating
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                          }`}
                          href={getFilterUrl({
                            rating: '4',
                            params: searchParamsObj,
                          })}
                        >
                          <Rating size={4} rating={4} />
                          <span>{t('Search.& Up')}</span>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleOnMobile>
            </div>

            {/* Products Grid */}
            <div className='md:col-span-2 lg:col-span-3 xl:col-span-4'>
              {data.products.length === 0 ? (
                <Card className='shadow-lg border-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm'>
                  <CardContent className='p-8 md:p-12 text-center'>
                    <div className='max-w-md mx-auto space-y-6'>
                      <div className='p-6 bg-gray-100 dark:bg-zinc-700 rounded-full w-24 h-24 mx-auto flex items-center justify-center'>
                        <SearchIcon className='h-12 w-12 text-gray-400' />
                      </div>
                      <div className='space-y-3'>
                        <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
                          {t('Search.No products found')}
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400 text-lg'>
                          {t(
                            'Search.Try adjusting your search terms or filters'
                          )}
                        </p>
                      </div>
                      <div className='space-y-2 pt-4'>
                        <p className='text-sm text-gray-500 dark:text-gray-500 font-medium'>
                          {t('Search.Suggestions')}:
                        </p>
                        <ul className='text-sm text-gray-500 dark:text-gray-400 space-y-1'>
                          <li>• {t('Search.Check spelling')}</li>
                          <li>• {t('Search.Try different keywords')}</li>
                          <li>• {t('Search.Remove filters')}</li>
                          <li>• {t('Search.Browse categories')}</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-6 md:space-y-8'>
                  {/* Products Grid */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6'>
                    {data.products.map((product: IProduct) => (
                      <div
                        key={product._id}
                        className='transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg'
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {data.totalPages > 1 && (
                    <div className='flex justify-center pt-8'>
                      <Card className='shadow-lg border-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm'>
                        <CardContent className='p-4'>
                          <Pagination
                            page={page}
                            totalPages={data.totalPages}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
