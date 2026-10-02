'use client'

import { useQuery } from '@tanstack/react-query'
import { applyHistoryMessages } from '@/lib/messages/message-cache'
import type { ChatIssueFact } from '@/lib/messages/types'
import { HTML_VALUES } from '@/lib/ui/constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'
import { HISTORY_TEST, MESSAGE_CACHE_TEST } from '../../../../history/constants'

const { chatA, message, MESSAGE } = HISTORY_TEST
const { OUTGOING, FAILED } = MESSAGE
const { ISSUES_KEY, ISSUES_OUTPUT, FAILURE_BUTTON } = MESSAGE_CACHE_TEST
const { BUTTON } = HTML_VALUES

export const HistoryFactsProbe = () => {
  const session = useOptionalQuerySession()
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
      <output data-testid={ISSUES_OUTPUT}>
        {JSON.stringify(issues.data ?? [])}
      </output>
    </>
  )
}
