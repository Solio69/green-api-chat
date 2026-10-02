'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext } from './context'
import { createNotificationConnection } from '@/lib/notifications/create-notification-connection'
import { NOTIFICATION_STATE } from '@/lib/notifications/constants'
import { NOTIFICATION_PROVIDER_COPY } from './constants'
import { NotificationNotice } from '@/components/NotificationNotice'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { LIMITED, PAUSED } = NOTIFICATION_STATE
const { QUERY_REQUIRED } = NOTIFICATION_PROVIDER_COPY

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(QUERY_REQUIRED)
  const [controller] = useState(() => createNotificationConnection({ session }))
  useEffect(() => controller.retain(), [controller])
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
  const restricted = state.status === LIMITED || state.status === PAUSED
  return (
    <NotificationContext.Provider value={controller}>
      <NotificationNotice />
      <div inert={restricted}>{children}</div>
    </NotificationContext.Provider>
  )
}
