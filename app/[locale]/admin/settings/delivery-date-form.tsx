/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ISettingInput } from '@/types'
import { TrashIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function DeliveryDateForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'availableDeliveryDates',
  })
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = form

  const availableDeliveryDates = watch('availableDeliveryDates')
  const defaultDeliveryDate = watch('defaultDeliveryDate')
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  useEffect(() => {
    const validNames = availableDeliveryDates.map((date) => date.name)
    if (!validNames.includes(defaultDeliveryDate)) {
      setValue('defaultDeliveryDate', '')
    }

    // Check for duplicate delivery dates
    const duplicates = availableDeliveryDates.filter(
      (date, index, self) =>
        self.findIndex((d) => d.name === date.name) !== index
    )

    if (duplicates.length > 0) {
      setDuplicateError(
        'Duplicate delivery dates detected. Please ensure all delivery dates are unique.'
      )
    } else {
      setDuplicateError(null)
    }
  }, [JSON.stringify(availableDeliveryDates)])

  // Ensure unique delivery dates for rendering
  const uniqueDeliveryDates = availableDeliveryDates.filter(
    (date, index, self) =>
      index === self.findIndex((d) => d.name === date.name) && date.name
  )

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Delivery Dates</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {duplicateError && (
          <div className='text-red-500 text-sm'>{duplicateError}</div>
        )}
        <div className='space-y-4'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex gap-2'>
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Name</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='Name' />
                    </FormControl>
                    <FormMessage>
                      {errors.availableDeliveryDates?.[index]?.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.daysToDeliver`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Days to Deliver</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='Days to Deliver' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]?.daysToDeliver
                          ?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.shippingPrice`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Shipping Price</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='Shipping Price' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]?.shippingPrice
                          ?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.freeShippingMinPrice`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && (
                      <FormLabel>Free Shipping Min Price</FormLabel>
                    )}
                    <FormControl>
                      <Input {...field} placeholder='Free Shipping Min Price' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]
                          ?.freeShippingMinPrice?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <div>
                {index == 0 && <div>Action</div>}
                <Button
                  type='button'
                  disabled={fields.length === 1}
                  variant='outline'
                  className={index == 0 ? 'mt-2' : ''}
                  onClick={() => {
                    remove(index)
                  }}
                >
                  <TrashIcon className='w-4 h-4' />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type='button'
            variant={'outline'}
            onClick={() =>
              append({
                name: '',
                daysToDeliver: 0,
                shippingPrice: 0,
                freeShippingMinPrice: 0,
              })
            }
          >
            Add Delivery Date
          </Button>
        </div>

        <FormField
          control={control}
          name='defaultDeliveryDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Delivery Date</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a delivery date' />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueDeliveryDates.map((date) => (
                      <SelectItem key={date.name} value={date.name}>
                        {date.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.defaultDeliveryDate?.message}</FormMessage>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
