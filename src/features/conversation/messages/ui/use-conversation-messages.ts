'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { messageKey } from '@/features/conversation/messages/application/message-cache'
import type { MessageCache } from '@/features/conversation/messages/model/types'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { MESSAGE_CACHE_CONFIG } from '@/features/conversation/messages/model/constants'

const { PROVIDER_REQUIRED } = MESSAGE_CACHE_CONFIG
export const useConversationMessages = (chatId: string | null) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const result = useQuery<MessageCache>({
    queryKey: messageKey({ connectionScope: session.connectionScope, chatId }),
    enabled: false,
  })
  const canRead = active && chatId !== null
  return { data: canRead ? result.data?.messages : undefined }
}
