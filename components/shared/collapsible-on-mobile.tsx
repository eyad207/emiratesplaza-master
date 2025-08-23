'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import useDeviceType from '@/hooks/use-device-type'
import { Button } from '../ui/button'
import {
  SlidersHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'

export default function CollapsibleOnMobile({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()

  const deviceType = useDeviceType()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (deviceType === 'mobile') setOpen(false)
    else if (deviceType === 'desktop') setOpen(true)
  }, [deviceType, searchParams])
  if (deviceType === 'unknown') return null
  return (
    <Collapsible open={open}>
      <CollapsibleTrigger asChild>
        {deviceType === 'mobile' && (
          <Button
            onClick={() => setOpen(!open)}
            variant={'outline'}
            className='w-full mb-4 h-12 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300'
          >
            <div className='flex items-center justify-between w-full'>
              <div className='flex items-center gap-3'>
                <div className='p-1.5 bg-primary/10 rounded-lg'>
                  <SlidersHorizontalIcon className='h-4 w-4 text-primary' />
                </div>
                <span className='font-semibold'>{title}</span>
              </div>
              {open ? (
                <ChevronUpIcon className='h-4 w-4 text-gray-500' />
              ) : (
                <ChevronDownIcon className='h-4 w-4 text-gray-500' />
              )}
            </div>
          </Button>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
