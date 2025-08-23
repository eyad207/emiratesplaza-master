import React from 'react'

import Header from '@/components/shared/header'
import HeaderSpacer from '@/components/shared/header/header-spacer'
import Footer from '@/components/shared/footer'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen dark:bg-zinc-900 dark:text-white'>
      <Header />
      <HeaderSpacer />
      <main className='flex-1 flex flex-col p-4'>{children}</main>
      <Footer />
    </div>
  )
}
