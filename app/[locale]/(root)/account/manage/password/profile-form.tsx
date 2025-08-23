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
import { updateUserPassword } from '@/lib/actions/user.actions'
import { UserPasswordSchema } from '@/lib/validator'

export const ProfileForm = () => {
  const router = useRouter()
  useSession()
  const form = useForm<z.infer<typeof UserPasswordSchema>>({
    resolver: zodResolver(UserPasswordSchema),
    defaultValues: {
      oldPassword: '',
      password: '',
      confirmPassword: '',
    },
  })
  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof UserPasswordSchema>) {
    const res = await updateUserPassword(values)
    if (!res.success)
      return toast({
        variant: 'destructive',
        description: res.message,
      })

    toast({
      description: res.message,
    })
    signOut()
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
            name='oldPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>Old Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Old Password'
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
                <FormLabel className='font-bold'>New Password</FormLabel>
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
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-bold'>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Confirm Password'
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
