'use client'

import { hashKey, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  applyHistoryMessages,
  messageKey,
} from '@/features/conversation/messages/application/message-cache'
import type { ChatIssueFact } from '@/features/conversation/messages/model/types'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { HISTORY_TEST, MESSAGE_CACHE_TEST } from '../../../../history/constants'

const { chatA, message, MESSAGE } = HISTORY_TEST
const { OUTGOING, FAILED } = MESSAGE
const { ISSUES_KEY, ISSUES_OUTPUT, WRITE_COUNT_OUTPUT, FAILURE_BUTTON } =
  MESSAGE_CACHE_TEST
const { BUTTON } = HTML_VALUES

export const HistoryFactsProbe = () => {
  const session = useOptionalQuerySession()
  const [messageWrites, setMessageWrites] = useState(0)
  useEffect(() => {
    if (!session) return
    const queryHash = hashKey(
      messageKey({ connectionScope: session.connectionScope, chatId: chatA }),
    )
    return session.client.getQueryCache().subscribe((event) => {
      const applied =
        event.type === 'updated' &&
        event.action.type === 'success' &&
        event.query.queryHash === queryHash
      if (applied) setMessageWrites((count) => count + 1)
    })
  }, [session])
  const issues = useQuery<ChatIssueFact[]>({
    queryKey: [ISSUES_KEY, session?.connectionScope],
    enabled: false,
  })
  const handleFailure = () => {
    if (!session) return
    applyHistoryMessages({
      session,
      chatId: chatA,
      messages: [{ ...message, direction: OUTGOING, status: FAILED }],
    })
  }
  return (
    <>
      <button type={BUTTON} onClick={handleFailure}>
        {FAILURE_BUTTON}
      </button>
      <output data-testid={WRITE_COUNT_OUTPUT}>{messageWrites}</output>
      <output data-testid={ISSUES_OUTPUT}>
        {JSON.stringify(issues.data ?? [])}
      </output>
    </>
  )
}
