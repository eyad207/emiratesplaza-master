import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { ChevronRight, CreditCard, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PaymentMethodCard from '@/components/shared/account/payment-method-card'

const PAGE_TITLE = 'Payment Options'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

// Example payment methods (in a real app, these would come from a database)
const mockPaymentMethods = [
  {
    id: '1',
    type: 'credit',
    cardNumber: '•••• •••• •••• 4242',
    cardBrand: 'visa',
    expiryDate: '12/25',
    isDefault: true,
    holderName: 'John Doe',
  },
  {
    id: '2',
    type: 'credit',
    cardNumber: '•••• •••• •••• 5555',
    cardBrand: 'mastercard',
    expiryDate: '10/24',
    isDefault: false,
    holderName: 'John Doe',
  },
]

export default async function PaymentsPage() {
  return (
    <div className='space-y-6'>
      {/* Breadcrumb navigation */}
      <div className='flex items-center gap-2 text-sm text-muted-foreground mb-4'>
        <Link
          href='/account'
          className='hover:text-foreground transition-colors'
        >
          Your Account
        </Link>
        <ChevronRight className='h-4 w-4' />
        <span className='font-medium text-foreground'>{PAGE_TITLE}</span>
      </div>

      <div>
        <h1 className='text-2xl sm:text-3xl font-bold mb-2'>{PAGE_TITLE}</h1>
        <p className='text-muted-foreground'>
          Manage your payment methods and preferences
        </p>
      </div>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader className='bg-muted/50'>
          <div className='flex items-center justify-between'>
            <CardTitle>Your Payment Methods</CardTitle>
            <AddPaymentMethodDialog />
          </div>
          <CardDescription>
            Securely manage your saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6 pb-2'>
          {mockPaymentMethods.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {mockPaymentMethods.map((method) => (
                <PaymentMethodCard key={method.id} method={method} />
              ))}
            </div>
          ) : (
            <div className='text-center py-10'>
              <CreditCard className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-2'>No payment methods</h3>
              <p className='text-muted-foreground mb-6'>
                Add a payment method to make checkout faster
              </p>
              <AddPaymentMethodDialog />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Preferences</CardTitle>
          <CardDescription>
            Set your default payment method and currency preferences
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='currency'>Preferred Currency</Label>{' '}
            <Select defaultValue='NOK'>
              <SelectTrigger className='w-full sm:w-[200px]'>
                <SelectValue placeholder='Select Currency' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='NOK'>NOK - Norwegian Kroner</SelectItem>
                <SelectItem value='USD'>USD - US Dollar</SelectItem>
                <SelectItem value='EUR'>EUR - Euro</SelectItem>
                <SelectItem value='AED'>AED - UAE Dirham</SelectItem>
                <SelectItem value='GBP'>GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='billing-address'>Default Billing Address</Label>
            <Select defaultValue='same'>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select Address' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='same'>Same as shipping address</SelectItem>
                <SelectItem value='home'>Home Address</SelectItem>
                <SelectItem value='work'>Work Address</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end border-t p-4'>
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>

      {/* Payment History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your recent transactions and payment activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground py-8'>
            <p>Your payment history will appear here</p>
            <p className='text-sm mt-2'>
              All your successful transactions will be listed in this section
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end border-t p-4'>
          <Link href='/account/orders'>
            <Button variant='outline'>View All Orders</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

// Dialog component for adding a new payment method
function AddPaymentMethodDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' className='gap-1'>
          <Plus className='h-4 w-4' />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Enter your card details to save a new payment method
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Cardholder Name</Label>
            <Input id='name' placeholder='John Doe' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='number'>Card Number</Label>
            <Input id='number' placeholder='0000 0000 0000 0000' />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='expiry'>Expiry Date</Label>
              <Input id='expiry' placeholder='MM/YY' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cvc'>CVC</Label>
              <Input id='cvc' placeholder='123' type='password' />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <input type='checkbox' id='default' className='rounded' />
            <Label htmlFor='default'>Make this my default payment method</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type='submit' className='w-full'>
            Save Payment Method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
