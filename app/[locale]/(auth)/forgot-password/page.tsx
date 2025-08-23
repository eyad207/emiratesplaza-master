'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { UserEmailSchema } from '@/lib/validator'
import { sendResetPasswordEmail } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'
import EmailButton from '@/components/EmailButton'
import { useTranslations } from 'next-intl'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const t = useTranslations('ForgotPassword')

  const form = useForm({
    resolver: zodResolver(UserEmailSchema),
    defaultValues: { email: '' },
  })

  const { control, handleSubmit, watch } = form
  const email = watch('email')

  const onSubmit = async (data: { email: string }) => {
    try {
      const res = await sendResetPasswordEmail(data.email)
      if (!res.success) {
        toast({
          title: t('Error'),
          description: res.message,
          variant: 'destructive',
        })
        return
      }
      toast({
        title: t('Success'),
        description: t('PasswordResetEmailSent'),
        variant: 'default',
      })
    } catch {
      toast({
        title: t('Error'),
        description: t('FailedToSendEmail'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='w-full max-w-md mx-auto space-y-8'>
      {/* Icon Section */}
      <div className='text-center space-y-4'>
        <div className='w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mx-auto flex items-center justify-center shadow-xl'>
          <svg
            className='w-10 h-10 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
            />
          </svg>
        </div>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            {t('ForgotPassword')}
          </h1>
          <p className='text-muted-foreground mt-2'>
            Enter your email to reset your password
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className='space-y-6'>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
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

            <div className='space-y-4'>
              <EmailButton email={email} />

              <div className='text-center'>
                <button
                  type='button'
                  onClick={() => router.push('/sign-in')}
                  className='text-primary hover:text-primary/80 font-medium hover:underline transition-colors duration-200'
                >
                  ← {t('SignIn')}
                </button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
