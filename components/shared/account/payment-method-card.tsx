'use client'

import { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface PaymentMethod {
  id: string
  type: string
  cardNumber: string
  cardBrand: string
  expiryDate: string
  isDefault: boolean
  holderName: string
}

interface PaymentMethodCardProps {
  method: PaymentMethod
}

export default function PaymentMethodCard({ method }: PaymentMethodCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Mock function - would be replaced with real action in production
  const handleDelete = () => {
    setIsDeleting(true)
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false)
      // Here you would handle the successful deletion
    }, 1000)
  }

  // Get card brand logo or default to generic credit card
  const getCardBrandIcon = () => {
    switch (method.cardBrand.toLowerCase()) {
      case 'visa':
        return (
          <div className='h-8 w-12 bg-blue-600 text-white rounded flex items-center justify-center font-bold'>
            VISA
          </div>
        )
      case 'mastercard':
        return (
          <div className='h-8 w-12 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded flex items-center justify-center font-bold text-xs'>
            MC
          </div>
        )
      case 'amex':
        return (
          <div className='h-8 w-12 bg-blue-400 text-white rounded flex items-center justify-center font-bold text-xs'>
            AMEX
          </div>
        )
      default:
        return <CreditCard className='h-8 w-10' />
    }
  }

  return (
    <Card
      className={cn(
        'border overflow-hidden transition-all',
        method.isDefault ? 'border-primary/50 shadow-md' : 'border-border/50'
      )}
    >
      <CardContent className='p-0'>
        <div className='p-4 flex items-center space-x-4'>
          <div className='shrink-0'>{getCardBrandIcon()}</div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <p className='font-medium'>{method.cardNumber}</p>
              {method.isDefault && (
                <Badge
                  variant='outline'
                  className='border-primary text-primary'
                >
                  <CheckCircle2 className='mr-1 h-3 w-3' /> Default
                </Badge>
              )}
            </div>
            <p className='text-sm text-muted-foreground'>
              {method.holderName} • Expires {method.expiryDate}
            </p>
          </div>
        </div>

        <div className='border-t bg-muted/30 px-4 py-2 flex justify-between items-center'>
          <p className='text-sm text-muted-foreground'>
            {!method.isDefault ? 'Set as default' : ''}
          </p>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <Edit className='h-4 w-4' />
              <span className='sr-only'>Edit</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete payment method?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this payment method from your
                    account.
                    {method.isDefault && (
                      <div className='mt-2 flex items-center text-amber-600 dark:text-amber-400'>
                        <AlertCircle className='h-4 w-4 mr-1' />
                        <span>
                          This is your default payment method. Removing it will
                          require selecting a new default.
                        </span>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
