'use client'

import { StrictMode } from 'react'
import { ChatHistoryPanel } from '@/features/conversation/ui/ChatHistoryPanel'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/features/conversation/ui/ConversationSelectionProvider'
import { MessageComposer } from '@/features/conversation/ui/MessageComposer'
import { MessageSendProvider } from '@/features/conversation/ui/MessageSendProvider'
import { NotificationProvider } from '@/features/conversation/ui/NotificationProvider'
import { HTML_VALUES } from '@/lib/ui/constants'
import { QueryProvider } from '@/components/QueryProvider'
import { HISTORY_TEST } from '../../../../history/constants'

const {
  scopeA,
  TARGET_A,
  TARGET_B,
  BUTTON_OPEN_A,
  BUTTON_OPEN_B,
  BUTTON_CLOSE,
} = HISTORY_TEST
const { BUTTON } = HTML_VALUES
const MessagingControls = () => {
  const { openConversation, closeConversation } = useConversationSelection()
  const handleOpenA = () => openConversation(TARGET_A)
  const handleOpenB = () => openConversation(TARGET_B)
  return (
    <>
      <button type={BUTTON} onClick={handleOpenA}>
        {BUTTON_OPEN_A}
      </button>
      <button type={BUTTON} onClick={handleOpenB}>
        {BUTTON_OPEN_B}
      </button>
      <button type={BUTTON} onClick={closeConversation}>
        {BUTTON_CLOSE}
      </button>
      <ChatHistoryPanel />
      <MessageComposer />
    </>
  )
}
export const MessagingProbe = () => (
  <StrictMode>
    <QueryProvider connectionScope={scopeA}>
      <NotificationProvider>
        <ConversationSelectionProvider>
          <MessageSendProvider>
            <MessagingControls />
          </MessageSendProvider>
        </ConversationSelectionProvider>
      </NotificationProvider>
    </QueryProvider>
  </StrictMode>
)
