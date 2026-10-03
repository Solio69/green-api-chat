'use client'

import { rememberPersonalChat } from '@/features/chats/application'
import { useChats } from '@/features/chats/ui'
import { ConversationChatListPanel } from '@/features/conversation/ui'
import { ConversationSelectionProvider } from '@/features/conversation/ui/ConversationSelectionProvider'
import { HTML_VALUES } from '@/lib/ui/constants'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'
import { SESSION_CHAT_TEST } from '../../../../chats/session-constants'
import { HISTORY_TEST } from '../../../../history/constants'

const { scopeA, chatA } = HISTORY_TEST
const { LABEL, ADD, REFRESH, OUTPUT, SOURCE } = SESSION_CHAT_TEST
const { ACCEPTED } = SOURCE
const { BUTTON } = HTML_VALUES
const OverlayControls = () => {
  const session = useOptionalQuerySession()
  const { data, refetch } = useChats()
  const handleAdd = () => {
    if (!session) return
    rememberPersonalChat({
      session,
      chatId: chatA,
      label: LABEL,
      source: ACCEPTED,
    })
  }
  // The session/Query hook owns completion and error state.
  const handleRefresh = () => {
    void refetch()
  }
  return (
    <>
      <button type={BUTTON} onClick={handleAdd}>
        {ADD}
      </button>
      <button type={BUTTON} onClick={handleRefresh}>
        {REFRESH}
      </button>
      <output data-testid={OUTPUT}>{JSON.stringify(data ?? [])}</output>
      <ConversationChatListPanel />
    </>
  )
}
export const SessionOverlayProbe = () => (
  <QueryProvider connectionScope={scopeA}>
    <ConversationSelectionProvider>
      <OverlayControls />
    </ConversationSelectionProvider>
  </QueryProvider>
)
