'use client'

import { ChatListPanel } from '@/features/chats/ui'
import { useConversationSelection } from '@/features/conversation/ui/ConversationSelectionProvider'
import { useUnreadCounts } from '@/lib/unread/use-unread-counts'

export const ConversationChatListPanel = () => {
  const { target, openConversation } = useConversationSelection()
  const { countsByChatId } = useUnreadCounts()
  return (
    <ChatListPanel
      selectedChatId={target?.chatId}
      unreadCountsByChatId={countsByChatId}
      onSelect={openConversation}
    />
  )
}
