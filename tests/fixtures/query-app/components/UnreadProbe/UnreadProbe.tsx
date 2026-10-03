'use client'

import { StrictMode } from 'react'
import { RecipientSearchForm } from '@/features/recipients/ui'
import { useUnreadCounts } from '@/lib/unread/use-unread-counts'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { AccountHeader } from '@/components/AccountHeader'
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel'
import { ChatListPanel } from '@/components/ChatListPanel'
import { ChatWorkspace } from '@/components/ChatWorkspace'
import { MessageComposer } from '@/components/MessageComposer'
import { NotificationProvider } from '@/components/NotificationProvider'
import { QueryProvider } from '@/components/QueryProvider'
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
          account={
            <AccountHeader
              account={{ label: ACCOUNT, avatarUrl: EMPTY_STRING }}
              logoutLabel={LOGOUT}
            />
          }
          search={<RecipientSearchForm />}
          chatList={<ChatListPanel />}
          conversation={<ChatHistoryPanel />}
          composer={<MessageComposer />}
        />
      </NotificationProvider>
    </QueryProvider>
  </StrictMode>
)
