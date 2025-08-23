import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getAllCategories } from '@/lib/actions/product.actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

export default async function Search({
  compact = false,
}: {
  compact?: boolean
}) {
  const {
    site: { name },
  } = await getSetting()
  const categories = await getAllCategories()

  const t = await getTranslations()

  // Different classes based on compact mode (mobile) vs full mode (desktop)
  const formClasses = cn(
    'flex items-stretch shadow-md rounded-md overflow-hidden',
    compact ? 'h-9 nav:h-10' : 'h-10'
  )

  // Common height class to apply to all components
  const heightClass = 'h-full'

  return (
    <form action='/search' method='GET' className={formClasses}>
      <Select name='category'>
        <SelectTrigger
          className={cn(
            'w-auto border-0 dark:border-gray-300 bg-gray-100 text-black rounded-r-none rounded-l-md rtl:rounded-r-md rtl:rounded-l-none',
            heightClass,
            compact
              ? 'min-w-[40px] xs:min-w-[60px] text-[10px] xs:text-xs'
              : 'min-w-[70px] xs:min-w-[80px]'
          )}
        >
          <SelectValue placeholder={t('Header.All')} />
        </SelectTrigger>
        <SelectContent position='popper' className='min-w-[150px]'>
          <SelectItem value='all'>{t('Header.All')}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className={cn(
          'flex-1 rounded-none dark:border-gray-300 bg-gray-100 text-black border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0',
          heightClass,
          compact ? 'text-xs xs:text-sm' : 'text-sm xs:text-base'
        )}
        placeholder={
          compact ? t('Header.Search') : t('Header.Search Site', { name })
        }
        name='q'
        type='search'
      />

      <button
        type='submit'
        className={cn(
          'bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-black rounded-s-none rounded-e-md transition-colors duration-200 flex items-center justify-center',
          heightClass,
          compact ? 'px-1.5 sm:px-2' : 'px-3 sm:px-4'
        )}
        aria-label={t('Header.Search')}
      >
        <SearchIcon className='w-3 h-3 xs:w-4 xs:h-4' />
      </button>
    </form>
  )
}
