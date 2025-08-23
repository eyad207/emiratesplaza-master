'use server'
import { ISettingInput } from '@/types'
import data from '../data'
import Setting from '../db/models/setting.model'
import { connectToDatabase } from '../db' // Use regular connection for consistency
import {} from '../utils'
import { cookies } from 'next/headers'

const globalForSettings = global as unknown as {
  cachedSettings: ISettingInput | null
  cacheTimestamp: number
}

// Initialize cache
if (!globalForSettings.cachedSettings) {
  globalForSettings.cachedSettings = null
  globalForSettings.cacheTimestamp = 0
}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes cache

export const getNoCachedSetting = async (): Promise<ISettingInput> => {
  await connectToDatabase()
  const setting = await Setting.findOne().lean().exec()
  return JSON.parse(JSON.stringify(setting)) as ISettingInput
}

export const getSetting = async (): Promise<ISettingInput> => {
  const now = Date.now()

  // Return cached data if available and not expired
  if (
    globalForSettings.cachedSettings &&
    now - globalForSettings.cacheTimestamp < CACHE_DURATION
  ) {
    return globalForSettings.cachedSettings
  }

  try {
    await connectToDatabase()
    const setting = await Setting.findOne().lean().exec()

    const settingData = setting
      ? JSON.parse(JSON.stringify(setting))
      : data.settings[0]

    // Update cache
    globalForSettings.cachedSettings = settingData
    globalForSettings.cacheTimestamp = now

    return settingData as ISettingInput
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Return default settings if database fails
    return data.settings[0] as ISettingInput
  }
}

export const updateSetting = async (newSetting: ISettingInput) => {
  try {
    await connectToDatabase()
    const updatedSetting = await Setting.findOneAndUpdate({}, newSetting, {
      upsert: true,
      new: true,
    })
      .lean()
      .exec()

    // Clear cache when updating
    globalForSettings.cachedSettings = JSON.parse(
      JSON.stringify(updatedSetting)
    )
    globalForSettings.cacheTimestamp = Date.now()

    return {
      success: true,
      message: 'Setting updated successfully',
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { success: false, message: 'Operation failed' }
  }
}

// Server action to update the currency cookie
export const setCurrencyOnServer = async (newCurrency: string) => {
  'use server'
  const cookiesStore = await cookies()
  cookiesStore.set('currency', newCurrency)

  return {
    success: true,
    message: 'Currency updated successfully',
  }
}
