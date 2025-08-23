import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    useSettingStore.setState({
      setting, // Move setState here to avoid calling it during render
    })
    setRendered(true)
  }, [setting])

  if (!rendered) {
    return null // Prevent rendering children until state is set
  }

  return children
}
