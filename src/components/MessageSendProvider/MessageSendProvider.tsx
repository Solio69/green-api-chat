'use client'

import { useMutation } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { createSendController } from '@/lib/sending/create-send-controller'
import { fetchSendMessage } from '@/lib/sending/fetch-send-message'
import { SEND_CONFIG } from '@/lib/sending/constants'
import { MESSAGE_SEND_PROVIDER_COPY } from './constants'
import { useNotificationOwner } from '@/components/NotificationProvider'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { NETWORK_MODE } = SEND_CONFIG

const {
  QUERY_REQUIRED: MESSAGE_SEND_PROVIDER_COPY_QUERY_REQUIRED,
  PROVIDER_REQUIRED: MESSAGE_SEND_PROVIDER_COPY_PROVIDER_REQUIRED,
} = MESSAGE_SEND_PROVIDER_COPY

const context = createContext<ReturnType<typeof createSendController> | null>(
  null,
)
export const MessageSendProvider = ({ children }: { children: ReactNode }) => {
  const session = useOptionalQuerySession()
  const owner = useNotificationOwner()
  if (!session) throw new Error(MESSAGE_SEND_PROVIDER_COPY_QUERY_REQUIRED)
  const { mutateAsync } = useMutation({
    mutationFn: fetchSendMessage,
    retry: false,
    networkMode: NETWORK_MODE,
    gcTime: 0,
  })
  const [controller] = useState(() =>
    createSendController({
      session,
      canSend: () => owner.getSnapshot().canSend,
      captureOwnerContext: owner.captureOwnerContext,
      isCurrentOwnerContext: owner.isCurrentOwnerContext,
      dispatch: mutateAsync,
    }),
  )
  return <context.Provider value={controller}>{children}</context.Provider>
}
export const useMessageSend = () => {
  const controller = useContext(context)
  if (!controller) throw new Error(MESSAGE_SEND_PROVIDER_COPY_PROVIDER_REQUIRED)
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )
  return {
    ...state,
    send: controller.send,
    clearResult: controller.clearResult,
  }
}
