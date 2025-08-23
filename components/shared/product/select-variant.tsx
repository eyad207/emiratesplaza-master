import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'

export default function SelectVariant({
  product,
  size,
  color,
}: {
  product: IProduct
  color: string
  size: string
}) {
  const selectedColor = color || product.colors[0]?.color
  const selectedSize = size || product.colors[0]?.sizes[0]?.size

  const getSizesForColor = (color: string) => {
    const colorObj = product.colors.find((c) => c.color === color)
    return colorObj ? colorObj.sizes : []
  }

  return (
    <>
      {product.colors.length > 0 && (
        <div className='space-x-2 space-y-2'>
          <div>Color:</div>
          {product.colors.map((x, index) => (
            <Button
              asChild
              variant='outline'
              className={
                selectedColor === x.color
                  ? 'border-2 border-primary'
                  : 'border-2'
              }
              key={index}
            >
              <Link
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: x.color,
                  size: selectedSize || '',
                })}`}
              >
                <div
                  style={{ backgroundColor: x.color }}
                  className='h-4 w-4 rounded-full border border-muted-foreground'
                ></div>
                {x.color}
              </Link>
            </Button>
          ))}
        </div>
      )}
      {selectedColor && getSizesForColor(selectedColor).length > 0 && (
        <div className='mt-2 space-x-2 space-y-2'>
          <div>Size:</div>
          {getSizesForColor(selectedColor).map((x, index) => (
            <Button
              asChild
              variant='outline'
              className={
                selectedSize === x.size
                  ? 'border-2  border-primary'
                  : 'border-2  '
              }
              key={index}
            >
              <Link
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: selectedColor,
                  size: x.size || '',
                })}`}
              >
                {x.size} ({x.countInStock})
              </Link>
            </Button>
          ))}
        </div>
      )}
    </>
  )
}
