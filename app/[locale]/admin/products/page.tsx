import { Metadata } from 'next'
import ProductList from './product-list'

export const metadata: Metadata = {
  title: 'Product Management | Admin Dashboard',
  description: 'Manage your product inventory, pricing, and availability',
}

export default async function AdminProduct() {
  return (
    <div className='min-h-screen'>
      <ProductList />
    </div>
  )
}
