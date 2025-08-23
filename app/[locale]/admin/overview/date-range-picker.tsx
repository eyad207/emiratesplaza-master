'use client'

import React from 'react'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn, formatDateTime } from '@/lib/utils'

export function CalendarDateRangePicker({
  defaultDate,
  setDate,
  className,
}: {
  defaultDate?: DateRange
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  className?: string
}) {
  const [calendarDate, setCalendarDate] = React.useState<DateRange | undefined>(
    defaultDate
  )

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            className={cn(
              'justify-start text-left font-normal',
              !calendarDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-0 h-4 w-4' />
            {calendarDate?.from ? (
              calendarDate.to ? (
                <>
                  {formatDateTime(calendarDate.from).dateOnly} -{' '}
                  {formatDateTime(calendarDate.to).dateOnly}
                </>
              ) : (
                formatDateTime(calendarDate.from).dateOnly
              )
            ) : (
              'Select date range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          onCloseAutoFocus={() => setCalendarDate(defaultDate)}
          className='w-auto p-0'
          align='end'
        >
          <Calendar
            mode='range'
            defaultMonth={defaultDate?.from}
            selected={calendarDate}
            onSelect={setCalendarDate}
            numberOfMonths={2}
          />
          <div className='flex gap-4 p-4 pt-0'>
            <PopoverClose asChild>
              <Button variant='outline' onClick={() => setDate(calendarDate)}>
                Apply
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button
                variant='outline'
                onClick={() => setCalendarDate(defaultDate)}
              >
                Cancel
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
