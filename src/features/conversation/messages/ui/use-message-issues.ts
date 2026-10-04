'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { messageIssuesKey } from '@/features/conversation/messages/application/message-status-issues'
import type { MessageIssue } from '@/features/conversation/messages/model/types'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { MESSAGE_CACHE_CONFIG } from '@/features/conversation/messages/model/constants'

const { PROVIDER_REQUIRED } = MESSAGE_CACHE_CONFIG
export const useMessageIssues = (chatId: string | null) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const result = useQuery<MessageIssue[]>({
    queryKey: messageIssuesKey(session.connectionScope),
    enabled: false,
  })
  const issues = active ? (result.data ?? []) : []
  const canReadChat = active && chatId !== null
  return {
    chat: canReadChat
      ? (issues.find((issue) => issue.chatId === chatId) ?? null)
      : null,
    connection: issues.find((issue) => issue.chatId === null) ?? null,
  }
}
