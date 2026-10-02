'use client'

import { StrictMode } from 'react'
import { HTML_VALUES } from '@/lib/ui/constants'
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/components/ConversationSelectionProvider'
import { MessageComposer } from '@/components/MessageComposer'
import { MessageSendProvider } from '@/components/MessageSendProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
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
