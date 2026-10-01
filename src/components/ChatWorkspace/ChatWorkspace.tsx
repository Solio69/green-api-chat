import type { ReactNode } from 'react'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ConversationEmptyState } from '@/components/ConversationEmptyState'
import styles from './ChatWorkspace.module.scss'

type ChatWorkspaceProps = {
  account: ReactNode
  search: ReactNode
  chatList: ReactNode
}

export const ChatWorkspace = ({
  account,
  search,
  chatList,
}: ChatWorkspaceProps) => (
  <div className={styles.chatWorkspace}>
    <ChatSidebar account={account} search={search} chatList={chatList} />
    <ConversationEmptyState />
  </div>
)
