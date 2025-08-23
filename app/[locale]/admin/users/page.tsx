import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteUser, getAllUsers } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import FilterInput from './FilterInput'

const PAGE_TITLE = 'Users'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

interface PageProps {
  searchParams: Promise<{ page?: string; name?: string }>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { page = '1', name = '' } = await searchParams
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')
  const users = await getAllUsers({
    page: Number(page),
    name,
  })
  return (
    <div>
      <h1 className='h1-bold pt-4'>{PAGE_TITLE}</h1>
      <FilterInput defaultValue={name} />
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className=''>
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.data.map((user: IUser) => (
              <TableRow key={user._id}>
                <TableCell>{user._id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/users/${user._id}`}>Edit</Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/users/${user._id}/orders`}>Orders</Link>
                  </Button>
                  <DeleteDialog id={user._id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.totalPages > 1 && (
          <Pagination page={page} totalPages={users.totalPages} />
        )}
      </div>
    </div>
  )
}
