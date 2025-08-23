import { Skeleton } from '@/components/ui/skeleton'

export default function GlobalLoading() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-4'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
        <Skeleton className='h-4 w-32 mx-auto' />
      </div>
    </div>
  )
}
