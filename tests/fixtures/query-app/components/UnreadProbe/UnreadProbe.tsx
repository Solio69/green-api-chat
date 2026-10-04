'use client'

import { StrictMode } from 'react'
import { AccountHeader } from '@/features/account/ui'
import { ChatSidebar } from '@/features/chats/ui'
import { ConversationChatListPanel } from '@/features/conversation/ui'
import { ChatHistoryPanel } from '@/features/conversation/ui/ChatHistoryPanel'
import { ChatWorkspace } from '@/features/conversation/ui/ChatWorkspace'
import { MessageComposer } from '@/features/conversation/ui/MessageComposer'
import { NotificationProvider } from '@/features/conversation/ui/NotificationProvider'
import { QueryProvider } from '@/features/conversation/ui/QueryProvider'
import { useUnreadCounts } from '@/features/conversation/unread/ui/use-unread-counts'
import { RecipientSearchForm } from '@/features/recipients/ui'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { HISTORY_TEST } from '../../../../history/constants'
import { UNREAD_TEST } from '../../../../unread/constants'
import '@/app/globals.scss'

const { scopeA } = HISTORY_TEST
const { ACCOUNT, LOGOUT, COUNTS } = UNREAD_TEST
const UnreadSnapshot = () => {
  const counts = useUnreadCounts()
  return (
    <output data-testid={COUNTS} hidden>
      {JSON.stringify(counts)}
    </output>
  )
}
export const UnreadProbe = () => (
  <StrictMode>
    <QueryProvider connectionScope={scopeA}>
      <NotificationProvider>
        <UnreadSnapshot />
        <ChatWorkspace
          sidebar={
            <ChatSidebar
              account={
                <AccountHeader
                  account={{ label: ACCOUNT, avatarUrl: EMPTY_STRING }}
                  logoutLabel={LOGOUT}
                />
              }
              search={<RecipientSearchForm />}
              chatList={<ConversationChatListPanel />}
            />
          }
          conversation={<ChatHistoryPanel />}
          composer={<MessageComposer />}
        />
      </NotificationProvider>
    </QueryProvider>
  </StrictMode>
)
