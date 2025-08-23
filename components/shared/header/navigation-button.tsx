'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface NavigationButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const NavigationButton = ({
  href,
  children,
  className,
}: NavigationButtonProps) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(href)
  }

  return (
    <Button variant='ghost' className={className} onClick={handleClick}>
      {children}
    </Button>
  )
}
