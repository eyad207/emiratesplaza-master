'use client'
import { redirect, useSearchParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useSettingStore from '@/hooks/use-setting-store'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignIn } from '@/types'
import { signInWithCredentials } from '@/lib/actions/user.actions'

import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignInSchema } from '@/lib/validator'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { useTranslations } from 'next-intl'

export default function CredentialsSignInForm() {
  const {
    setting: { site },
  } = useSettingStore()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const router = useRouter()
  const t = useTranslations('SignIn')

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignIn) => {
    try {
      await signInWithCredentials({
        email: data.email,
        password: data.password,
      })
      redirect(callbackUrl)
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }
      toast({
        title: t('Error'),
        description: t('InvalidEmailOrPassword'),
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='text-sm font-medium text-foreground'>
                  {t('Email')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('EnterEmail')}
                    {...field}
                    className='h-12 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='text-sm font-medium text-foreground'>
                  {t('Password')}
                </FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder={t('EnterPassword')}
                    {...field}
                    className='h-12 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='space-y-4'>
            <Button
              type='submit'
              className='w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]'
            >
              {t('SignIn')}
            </Button>

            <div className='text-center'>
              <span className='text-sm text-muted-foreground mr-1'>
                {t('ForgotPassword')}
              </span>
              <button
                type='button'
                onClick={() => router.push('/forgot-password')}
                className='text-sm text-primary hover:text-primary/80 font-medium hover:underline transition-colors duration-200'
              >
                {t('ResetItHere')}
              </button>
            </div>

            <div className='text-center text-xs text-muted-foreground leading-relaxed'>
              {t('BySigningIn', { siteName: site.name })}{' '}
              <button
                type='button'
                onClick={() => router.push('/page/conditions-of-use')}
                className='text-primary hover:text-primary/80 hover:underline transition-colors duration-200'
              >
                {t('ConditionsOfUse')}
              </button>{' '}
              {t('and')}{' '}
              <button
                type='button'
                onClick={() => router.push('/page/privacy-policy')}
                className='text-primary hover:text-primary/80 hover:underline transition-colors duration-200'
              >
                {t('PrivacyNotice')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
