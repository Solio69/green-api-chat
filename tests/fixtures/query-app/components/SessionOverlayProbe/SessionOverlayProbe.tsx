'use client'

import { rememberPersonalChat } from '@/lib/chats/session-chat-facts'
import { useChats } from '@/lib/chats/use-chats'
import { HTML_VALUES } from '@/lib/ui/constants'
import { ChatListPanel } from '@/components/ChatListPanel'
import { ConversationSelectionProvider } from '@/components/ConversationSelectionProvider'
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
  const handleRefresh = () => refetch()
  return (
    <>
      <button type={BUTTON} onClick={handleAdd}>
        {ADD}
      </button>
      <button type={BUTTON} onClick={handleRefresh}>
        {REFRESH}
      </button>
      <output data-testid={OUTPUT}>{JSON.stringify(data ?? [])}</output>
      <ChatListPanel />
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
