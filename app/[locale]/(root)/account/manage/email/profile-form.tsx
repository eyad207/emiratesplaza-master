'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSession, signOut } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { updateUserEmail } from '@/lib/actions/user.actions'
import { UserEmailSchema } from '@/lib/validator'

export const ProfileForm = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const form = useForm<z.infer<typeof UserEmailSchema>>({
    resolver: zodResolver(UserEmailSchema),
    defaultValues: {
      email: session?.user?.email ?? '',
      password: '',
    },
  })
  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof UserEmailSchema>) {
    const res = await updateUserEmail(values)
    if (!res.success)
      return toast({
        variant: 'destructive',
        description: res.message,
      })

    toast({
      description: res.message,
    })
    await signOut()
    router.push('/signin')
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='  flex flex-col gap-5'
      >
        <div className='flex flex-col gap-5'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>New Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Email'
                    {...field}
                    className='input-field'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Password'
                    {...field}
                    className='input-field'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type='submit'
          size='lg'
          disabled={form.formState.isSubmitting}
          className='button col-span-2 w-full'
        >
          {form.formState.isSubmitting ? 'Submitting...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
