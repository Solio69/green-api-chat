import type { ReactNode } from 'react'
import { SIDEBAR_COPY } from './constants'
import styles from './ChatSidebar.module.scss'

const { LABEL } = SIDEBAR_COPY
type ChatSidebarProps = {
  account: ReactNode
  search: ReactNode
  chatList: ReactNode
}

export const ChatSidebar = ({
  account,
  search,
  chatList,
}: ChatSidebarProps) => (
  <aside className={styles.chatSidebar} aria-label={LABEL}>
    {account}
    <div className={styles.chatSidebar__search}>{search}</div>
    <div className={styles.chatSidebar__list}>{chatList}</div>
  </aside>
)
