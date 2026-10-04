'use client'

import type { ReactNode } from 'react'
import { useWorkspaceFocus } from './use-workspace-focus'
import { ConversationEmptyState } from '@/features/conversation/ui/ConversationEmptyState'
import { ConversationPane } from '@/features/conversation/ui/ConversationPane'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/features/conversation/ui/ConversationSelectionProvider'
import { MessageSendProvider } from '@/features/conversation/ui/MessageSendProvider'
import { useOptionalNotificationOwner } from '@/features/conversation/ui/NotificationProvider'
import { useConversationReadState } from '@/features/conversation/unread/ui/use-conversation-read-state'
import styles from './ChatWorkspace.module.scss'

type ChatWorkspaceProps = {
  sidebar: ReactNode
  conversation?: ReactNode
  composer?: ReactNode
}

const WorkspaceContent = ({
  sidebar,
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
        {sidebar}
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
