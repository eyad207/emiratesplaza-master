'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import useSettingStore from '@/hooks/use-setting-store'
import { setCurrencyOnServer } from '@/lib/actions/setting.actions'
import { useRouter } from 'next/navigation'
import LoadingOverlay, {
  InlineSpinner,
} from '@/components/shared/loading-overlay'

export default function CurrencySwitcher() {
  const {
    setting: { availableCurrencies, currency },
    setCurrency,
  } = useSettingStore()
  const [loading, setLoading] = React.useState(false) // Add loading state
  const router = useRouter()

  const handleCurrencyChange = async (newCurrency: string) => {
    setLoading(true)
    try {
      await setCurrencyOnServer(newCurrency)
      setCurrency(newCurrency)
      // Add a small delay to show the loading animation
      await new Promise((resolve) => setTimeout(resolve, 800))
      router.refresh()
    } catch (error) {
      console.error('Failed to change currency:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCurrency = availableCurrencies.find((c) => c.code === currency)

  return (
    <>
      <LoadingOverlay
        isVisible={loading}
        type='currency'
        message='Updating prices and currency...'
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className='header-button h-[41px]'
          aria-label={`Current currency: ${currency}. Click to change currency`}
          aria-expanded={false}
          aria-haspopup='menu'
          role='button'
          disabled={loading}
        >
          <div className='flex items-center gap-1'>
            {loading ? (
              <InlineSpinner size='sm' className='mr-1' />
            ) : (
              <span className='text-xl' aria-hidden='true'>
                {selectedCurrency?.symbol}
              </span>
            )}
            <span className='hidden sm:inline'>{currency}</span>
            <ChevronDownIcon aria-hidden='true' />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className='w-56'
          role='menu'
          aria-label='Currency selection menu'
        >
          <DropdownMenuLabel>Currency</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currency}
            onValueChange={handleCurrencyChange}
          >
            {availableCurrencies.map((c) => (
              <DropdownMenuRadioItem
                key={c.name}
                value={c.code}
                role='menuitemradio'
                aria-label={`Change currency to ${c.code} (${c.name})`}
                disabled={loading}
                className={loading ? 'opacity-50 cursor-not-allowed' : ''}
                onClick={() => !loading && handleCurrencyChange(c.code)}
              >
                <div className='flex items-center justify-between w-full'>
                  <span>
                    {c.symbol} {c.code}
                  </span>
                  {loading && c.code !== currency && (
                    <InlineSpinner size='sm' />
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
