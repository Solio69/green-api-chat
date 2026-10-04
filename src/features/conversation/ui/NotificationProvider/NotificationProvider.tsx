'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { NotificationContext } from './context'
import { createNotificationConnection } from '@/features/conversation/notifications/application/create-notification-connection'
import { NotificationNotice } from '@/features/conversation/ui/NotificationNotice'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { NOTIFICATION_STATE } from '@/features/conversation/notifications/model/constants'
import { NOTIFICATION_PROVIDER_COPY } from './constants'

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
