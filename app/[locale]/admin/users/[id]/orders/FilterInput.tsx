'use client'

import { Input } from '@/components/ui/input'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function FilterInput({
  defaultValue,
}: {
  defaultValue: string
}) {
  const [value, setValue] = useState(defaultValue)
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (newValue) {
      params.set('orderId', newValue)
    } else {
      params.delete('orderId')
    }
    router.push(`?${params.toString()}`)
  }

  const handleReset = () => {
    setValue('')
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('orderId')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className='flex gap-2'>
      <Input
        placeholder='Filter by Order ID'
        value={value}
        onChange={handleChange}
      />
      <Button variant='outline' onClick={handleReset}>
        Reset
      </Button>
    </div>
  )
}
