import { auth } from '@/auth'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'
import ReviewList from './review-list'
import { generateId, round2 } from '@/lib/utils'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import { Separator } from '@/components/ui/separator'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import TranslatedText from '@/components/shared/translated-text'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const product = await getProductBySlug(params.slug)
  if (!product) {
    return { title: t('Product.Product not found') }
  }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const searchParams = await props.searchParams

  const { page, color, size } = searchParams

  const params = await props.params

  const { slug } = params

  const session = await auth()

  const product = await getProductBySlug(slug)

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  const t = await getTranslations()

  const selectedColor = color || product.colors[0]?.color
  const selectedSize = size || product.colors[0]?.sizes[0]?.size

  const getSizesForColor = (color: string) => {
    const colorObj = product.colors.find((c) => c.color === color)
    return colorObj ? colorObj.sizes : []
  }

  const getCountInStockForSelectedVariant = () => {
    const sizes = getSizesForColor(selectedColor)
    const sizeObj = sizes.find((s) => s.size === selectedSize)
    return sizeObj ? sizeObj.countInStock : 0
  }

  return (
    <div className='dark:bg-zinc-900 dark:text-white'>
      <AddToBrowsingHistory id={product._id} category={product.category} />
      <section>
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 '>
          <div className='md:col-span-3 md:mb-6 lg:col-span-2'>
            <ProductGallery images={product.images} />
          </div>

          <div className='flex w-full flex-col gap-2 md:p-5 col-span-2'>
            <div className='flex flex-col gap-3'>
              <p className='p-medium-16 rounded-full bg-grey-500/10   text-grey-500'>
                {t('Product.Brand')} {product.brand} {product.category}
              </p>
              <h1 className='font-bold text-lg lg:text-xl'>
                <TranslatedText
                  text={product.name}
                  fallback={product.name}
                  enableTranslation={true}
                />
              </h1>

              <RatingSummary
                avgRating={product.avgRating}
                numReviews={product.numReviews}
                asPopover
                ratingDistribution={product.ratingDistribution}
              />
              <Separator />
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <div className='flex gap-3'>
                  <ProductPrice
                    price={product.price}
                    discountedPrice={product.discountedPrice ?? undefined}
                    isDeal={product.tags.includes('todays-deal')}
                    forListing={false}
                  />
                </div>
              </div>
            </div>
            <div>
              <SelectVariant
                product={product}
                size={selectedSize}
                color={selectedColor}
              />
            </div>
            <Separator className='my-2' />{' '}
            <div className='flex flex-col gap-2'>
              <p className='p-bold-20 text-grey-600'>
                {t('Product.Description')}:
              </p>{' '}
              <div className='p-medium-16 lg:p-regular-18'>
                <TranslatedText
                  text={product.description}
                  fallback={product.description}
                  enableTranslation={true}
                />
              </div>
            </div>
          </div>
          <div>
            <Card>
              <CardContent className='p-4 flex flex-col gap-4'>
                <ProductPrice
                  price={product.price}
                  discountedPrice={product.discountedPrice ?? undefined}
                />
                {getCountInStockForSelectedVariant() > 0 &&
                  getCountInStockForSelectedVariant() <= 3 && (
                    <div className='text-destructive font-bold'>
                      {t('Product.Only X left in stock - order soon', {
                        count: getCountInStockForSelectedVariant(),
                      })}
                    </div>
                  )}
                {getCountInStockForSelectedVariant() !== 0 ? (
                  <div className='text-green-700 text-xl'>
                    {t('Product.In Stock')}
                  </div>
                ) : (
                  <div className='text-destructive text-xl'>
                    {t('Product.Out of Stock')}
                  </div>
                )}

                {getCountInStockForSelectedVariant() !== 0 && (
                  <div className='flex justify-center items-center'>
                    <AddToCart
                      item={{
                        clientId: generateId(),
                        product: product._id,
                        name: product.name,
                        slug: product.slug,
                        category: product.category,
                        price: round2(product.price),
                        discountedPrice: product.discountedPrice
                          ? round2(product.discountedPrice)
                          : undefined,
                        discount: product.discount || undefined,
                        quantity: 1,
                        image: product.images[0],
                        size: selectedSize,
                        color: selectedColor,
                        colors: product.colors,
                      }}
                      selectedSize={selectedSize}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className='mt-10'>
        <h2 className='h2-bold mb-2' id='reviews'>
          {t('Product.Customer Reviews')}
        </h2>
        <ReviewList product={product} userId={session?.user.id} />
      </section>
      <section className='mt-10'>
        <ProductSlider
          products={relatedProducts.data}
          title={t('Product.Best Sellers in', { name: product.category })}
        />
      </section>
      <section>
        <BrowsingHistoryList className='mt-10' />
      </section>
    </div>
  )
}
