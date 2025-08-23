'use server'

import bcrypt from 'bcryptjs'
import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp } from '@/types'
import {
  UserSignUpSchema,
  UserUpdateSchema,
  UserEmailSchema,
  UserPasswordSchema,
} from '../validator'
import { connectToDatabase } from '../db'
import User, { IUser } from '../db/models/user.model'
import {} from '../utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { sendEmail } from '@/lib/email'

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await connectToDatabase()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })
    return { success: true, message: 'User created successfully' }
  } catch {
    return { success: false, error: 'Operation failed' }
  }
}

export async function sendVerificationCode(email: string, name: string) {
  try {
    await connectToDatabase()
    const existingUserByName = await User.findOne({ name })
    if (existingUserByName) {
      return { success: false, error: 'Username is already taken' }
    }

    const existingUserByEmail = await User.findOne({ email })
    if (existingUserByEmail) {
      return { success: false, error: 'Email is already taken' }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await sendEmail({
      to: email,
      subject: 'Your Verification Code',
      text: `Hello ${name},\n\nYour verification code is: ${code}\n\nThank you!`,
    })
    return { success: true, code }
  } catch {
    return { success: false, error: 'Operation failed' }
  }
}

export async function verifyCodeAndRegisterUser(email: string, name: string) {
  try {
    // Here you should verify the code (e.g., check if it matches the one sent to the user)
    // For simplicity, let's assume the code is always correct

    const userSignUp: IUserSignUp = {
      name,
      email,
      password: 'defaultPassword', // You should handle password securely
      confirmPassword: 'defaultPassword',
    }

    const res = await registerUser(userSignUp)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    await signInWithCredentials({ email, password: 'defaultPassword' })
    return { success: true }
  } catch {
    return { success: false, error: 'Operation failed' }
  }
}

// DELETE

export async function deleteUser(id: string) {
  try {
    await connectToDatabase()
    const res = await User.findByIdAndDelete(id)
    if (!res) throw new Error('Use not found')
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}
// UPDATE

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    await connectToDatabase()
    const dbUser = await User.findById(user._id)
    if (!dbUser) throw new Error('User not found')
    dbUser.name = user.name
    dbUser.email = user.email
    dbUser.role = user.role
    const updatedUser = await dbUser.save()
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}
export async function updateUserName(user: IUserName) {
  try {
    await connectToDatabase()
    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')

    const existingUser = await User.findOne({ name: user.name })
    if (existingUser) throw new Error('Name already exists')

    currentUser.name = user.name
    const updatedUser = await currentUser.save()
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export async function updateUserEmail(
  emailData: z.infer<typeof UserEmailSchema>
) {
  try {
    await connectToDatabase()
    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')

    const isMatch = await bcrypt.compare(
      emailData.password,
      currentUser.password
    )
    if (!isMatch) throw new Error('Password is incorrect')

    currentUser.email = emailData.email
    const updatedUser = await currentUser.save()
    await signOut({ redirect: false })
    return {
      success: true,
      message: 'Email updated successfully. Please sign in again.',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export async function updateUserPassword(
  passwordData: z.infer<typeof UserPasswordSchema>
) {
  try {
    await connectToDatabase()
    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')

    const isMatch = await bcrypt.compare(
      passwordData.oldPassword,
      currentUser.password
    )
    if (!isMatch) throw new Error('Old password is incorrect')

    currentUser.password = await bcrypt.hash(passwordData.password, 5)
    const updatedUser = await currentUser.save()
    await signOut({ redirect: false })
    return {
      success: true,
      message: 'Password updated successfully. Please sign in again.',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', { ...user, redirect: false })
}
export const SignInWithGoogle = async () => {
  await signIn('google')
}
export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

// GET
export async function getAllUsers({
  limit,
  page,
  name,
}: {
  limit?: number
  page: number
  name?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const filter = name ? { name: { $regex: name, $options: 'i' } } : {}
  const users = await User.find(filter)
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const usersCount = await User.countDocuments(filter)
  return {
    data: JSON.parse(JSON.stringify(users)) as IUser[],
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  await connectToDatabase()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user)) as IUser
}

export async function sendResetPasswordEmail(email: string) {
  try {
    const response = await fetch('/api/send-reset-password-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error('Failed to send reset password email')
    }

    return { success: true, message: 'Password reset email sent successfully' }
  } catch {
    return { success: false, message: 'Operation failed' }
  }
}

export async function checkEmailRegistered(email: string) {
  try {
    await connectToDatabase()
    const user = await User.findOne({ email })
    return !!user
  } catch {
    return false
  }
}
