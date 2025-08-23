import Header from '@/components/shared/header'
import HeaderSpacer from '@/components/shared/header/header-spacer'
import Footer from '@/components/shared/footer'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen bg-border '>
      <Header />
      <HeaderSpacer />
      <main className='flex-1 flex flex-col bg-border'>{children}</main>
      <Footer />
    </div>
  )
}
