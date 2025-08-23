import React from 'react'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='bg-muted/30 min-h-[calc(100vh-var(--header-height))] w-full py-6 sm:py-8 md:py-10'>
      <div className='container max-w-5xl mx-auto px-4 sm:px-6'>{children}</div>
    </div>
  )
}
