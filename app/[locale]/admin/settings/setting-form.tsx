'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { SettingInputSchema } from '@/lib/validator'
import { ClientSetting, ISettingInput } from '@/types'
import { updateSetting } from '@/lib/actions/setting.actions'
import useSetting from '@/hooks/use-setting-store'
import LanguageForm from './language-form'
import CurrencyForm from './currency-form'
import PaymentMethodForm from './payment-method-form'
import DeliveryDateForm from './delivery-date-form'
import SiteInfoForm from './site-info-form'
import CommonForm from './common-form'
import CarouselForm from './carousel-form'

const SettingForm = ({ setting }: { setting: ISettingInput }) => {
  const { setSetting } = useSetting()

  const form = useForm<ISettingInput>({
    resolver: zodResolver(SettingInputSchema),
    defaultValues: setting,
  })
  const {
    formState: { isSubmitting },
  } = form

  const { toast } = useToast()
  async function onSubmit(values: ISettingInput) {
    // Check for duplicate payment methods
    const duplicatePaymentMethods = values.availablePaymentMethods.filter(
      (method, index, self) =>
        self.findIndex((m) => m.name === method.name) !== index
    )

    if (duplicatePaymentMethods.length > 0) {
      toast({
        variant: 'destructive',
        description:
          'Duplicate payment methods detected. Please ensure all payment methods are unique.',
      })
      return
    }

    // Check for duplicate delivery dates
    const duplicateDeliveryDates = values.availableDeliveryDates.filter(
      (date, index, self) =>
        self.findIndex((d) => d.name === date.name) !== index
    )

    if (duplicateDeliveryDates.length > 0) {
      toast({
        variant: 'destructive',
        description:
          'Duplicate delivery dates detected. Please ensure all delivery dates are unique.',
      })
      return
    }

    // Check for duplicate languages
    const duplicateLanguages = values.availableLanguages.filter(
      (lang, index, self) =>
        self.findIndex((l) => l.code === lang.code) !== index
    )

    if (duplicateLanguages.length > 0) {
      toast({
        variant: 'destructive',
        description:
          'Duplicate languages detected. Please ensure all languages are unique.',
      })
      return
    }

    // Check for duplicate currencies
    const duplicateCurrencies = values.availableCurrencies.filter(
      (currency, index, self) =>
        self.findIndex(
          (c) =>
            c.name === currency.name &&
            c.code === currency.code &&
            c.symbol === currency.symbol
        ) !== index
    )

    if (duplicateCurrencies.length > 0) {
      toast({
        variant: 'destructive',
        description:
          'Duplicate currencies detected. Please ensure all currencies are unique.',
      })
      return
    }

    const res = await updateSetting({ ...values })
    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      })
    } else {
      toast({
        description: res.message,
      })
      setSetting(values as ClientSetting)
    }
  }

  return (
    <Form {...form}>
      <form
        className='space-y-4'
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <SiteInfoForm id='setting-site-info' form={form} />
        <CommonForm id='setting-common' form={form} />
        <CarouselForm id='setting-carousels' form={form} />

        <LanguageForm id='setting-languages' form={form} />

        <CurrencyForm id='setting-currencies' form={form} />

        <PaymentMethodForm id='setting-payment-methods' form={form} />

        <DeliveryDateForm id='setting-delivery-dates' form={form} />

        <div>
          <Button
            type='submit'
            size='lg'
            disabled={isSubmitting}
            className='w-full mb-24'
          >
            {isSubmitting ? 'Submitting...' : `Save Setting`}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default SettingForm
