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

export default function LanguageForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'availableLanguages',
  })
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = form

  const availableLanguages = watch('availableLanguages')
  const defaultLanguage = watch('defaultLanguage')
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  useEffect(() => {
    const validCodes = availableLanguages.map((lang) => lang.code)
    if (!validCodes.includes(defaultLanguage)) {
      setValue('defaultLanguage', '')
    }

    // Check for duplicate languages by both name and code
    const duplicates = availableLanguages.filter(
      (lang, index, self) =>
        self.findIndex((l) => l.code === lang.code || l.name === lang.name) !==
        index
    )

    if (duplicates.length > 0) {
      setDuplicateError(
        'Duplicate languages detected. Please ensure all language names and codes are unique.'
      )
    } else {
      setDuplicateError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(availableLanguages)])

  // Ensure unique languages for rendering
  const uniqueLanguages = availableLanguages.filter(
    (lang, index, self) =>
      index === self.findIndex((l) => l.code === lang.code) && lang.code
  )

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
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
                name={`availableLanguages.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Name</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='Name' />
                    </FormControl>
                    <FormMessage>
                      {errors.availableLanguages?.[index]?.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableLanguages.${index}.code`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Code</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='Code' />
                    </FormControl>
                    <FormMessage>
                      {errors.availableLanguages?.[index]?.code?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableLanguages.${index}.icon`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>Flag</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='🇺🇸' />
                    </FormControl>
                    <FormMessage>
                      {errors.availableLanguages?.[index]?.icon?.message}
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
            onClick={() => append({ name: '', code: '', icon: '' })}
          >
            Add Language
          </Button>
        </div>

        <FormField
          control={control}
          name='defaultLanguage'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Language</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a language' />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.defaultLanguage?.message}</FormMessage>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
