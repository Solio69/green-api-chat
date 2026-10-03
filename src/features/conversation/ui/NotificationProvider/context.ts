'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
import type {
  createNotificationConnection,
  ConnectionState,
} from '@/lib/notifications/create-notification-connection'
import { NOTIFICATION_STATE } from '@/lib/notifications/constants'
import { NOTIFICATION_PROVIDER_COPY } from './constants'

const { CLOSED } = NOTIFICATION_STATE
const { PROVIDER_REQUIRED } = NOTIFICATION_PROVIDER_COPY
type Controller = ReturnType<typeof createNotificationConnection>
export const NotificationContext = createContext<Controller | null>(null)

export const useOptionalNotificationOwner = () =>
  useContext(NotificationContext)
export const useNotificationOwner = (): Controller => {
  const controller = useOptionalNotificationOwner()
  if (!controller) throw new Error(PROVIDER_REQUIRED)
  return controller
}
const empty: ConnectionState = { status: CLOSED, canSend: false, issue: null }
const noSubscribe = () => () => undefined
const emptySnapshot = () => empty
export const useOptionalNotificationConnection = () => {
  const controller = useOptionalNotificationOwner()
  const state = useSyncExternalStore(
    controller?.subscribe ?? noSubscribe,
    controller?.getSnapshot ?? emptySnapshot,
    emptySnapshot,
  )
  return controller && { ...state, retry: controller.retry }
}
export const useNotificationConnection = () => {
  const state = useOptionalNotificationConnection()
  if (!state) throw new Error(PROVIDER_REQUIRED)
  return state
}
