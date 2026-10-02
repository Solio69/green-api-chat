'use client'

import type { ReactNode } from 'react'
import { useWorkspaceFocus } from './use-workspace-focus'
import { useConversationReadState } from '@/lib/unread/use-conversation-read-state'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ConversationEmptyState } from '@/components/ConversationEmptyState'
import { ConversationPane } from '@/components/ConversationPane'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/components/ConversationSelectionProvider'
import { MessageSendProvider } from '@/components/MessageSendProvider'
import { useOptionalNotificationOwner } from '@/components/NotificationProvider'
import styles from './ChatWorkspace.module.scss'

type ChatWorkspaceProps = {
  account: ReactNode
  search: ReactNode
  chatList: ReactNode
  conversation?: ReactNode
  composer?: ReactNode
}

const WorkspaceContent = ({
  account,
  search,
  chatList,
  conversation,
  composer,
}: ChatWorkspaceProps) => {
  const { target, accessId, mobilePanel } = useConversationSelection()
  const {
    sidebarRef,
    paneRef,
    headingRef,
    handleFocusCapture,
    handleBlurCapture,
  } = useWorkspaceFocus({ target, accessId, mobilePanel })
  useConversationReadState({ paneRef, target, accessId, mobilePanel })
  return (
    <div
      className={styles.chatWorkspace}
      data-mobile-panel={mobilePanel}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <div
        className={styles.chatWorkspace__sidebar}
        ref={sidebarRef}
        tabIndex={-1}
      >
        <ChatSidebar account={account} search={search} chatList={chatList} />
      </div>
      <div className={styles.chatWorkspace__conversation} ref={paneRef}>
        {target ? (
          <ConversationPane headingRef={headingRef} composer={composer}>
            {conversation}
          </ConversationPane>
        ) : (
          <ConversationEmptyState />
        )}
      </div>
    </div>
  )
}

export const ChatWorkspace = (props: ChatWorkspaceProps) => {
  const owner = useOptionalNotificationOwner()
  const content = <WorkspaceContent {...props} />
  return (
    <ConversationSelectionProvider>
      {owner ? <MessageSendProvider>{content}</MessageSendProvider> : content}
    </ConversationSelectionProvider>
  )
}
