import { redirect } from 'next/navigation'
import { getAccountSettings } from '@/features/account/server'
import { AccountHeader } from '@/features/account/ui'
import { resolveHome } from '@/features/auth/application'
import { HOME_RESULT_KIND } from '@/features/auth/model'
import { LogoutButton } from '@/features/auth/ui'
import { ChatSidebar } from '@/features/chats/ui'
import {
  ChatHistoryPanel,
  ChatWorkspace,
  ConversationChatListPanel,
  MessageComposer,
  NotificationProvider,
} from '@/features/conversation/ui'
import { QueryProvider } from '@/features/conversation/ui/QueryProvider'
import { RecipientSearchForm } from '@/features/recipients/ui'
import { ThemeToggle } from '@/features/theme/ui'
import { readPageSession } from '@/server/session'
import { ROUTES } from '@/shared/kernel/routes/constants'
import { HOME_COPY } from './constants'
import styles from './HomePage.module.scss'

const { HOME, LOGIN, END_SESSION } = ROUTES
const {
  LOGIN: REQUIRE_LOGIN,
  END_SESSION: END_CURRENT_SESSION,
  RETRY: RETRY_CHECK,
} = HOME_RESULT_KIND
const { RETRY, RETRY_LINK, LOGOUT } = HOME_COPY
const HomePage = async () => {
  const access = await readPageSession()
  const credentials = access.context?.credentials ?? null
  const result = await resolveHome({ credentials, getAccountSettings })
  if (result.kind === REQUIRE_LOGIN) redirect(LOGIN)
  if (result.kind === END_CURRENT_SESSION) redirect(END_SESSION)
  if (result.kind === RETRY_CHECK)
    return (
      <main className={styles.homePage}>
        <div className={styles.homePage__content}>
          <p>{RETRY}</p>
          <a className={styles.homePage__retryLink} href={HOME}>
            {RETRY_LINK}
          </a>
          <LogoutButton label={LOGOUT} />
        </div>
      </main>
    )
  if (access.kind !== 'authorized') redirect(LOGIN)
  const connectionScope = access.context.connectionScope
  return (
    <main className={`${styles.homePage} ${styles.homePageWithTheme}`}>
      <div className={styles.homePage__themeControl}>
        <ThemeToggle />
      </div>
      <QueryProvider key={connectionScope} connectionScope={connectionScope}>
        <NotificationProvider>
          <ChatWorkspace
            sidebar={
              <ChatSidebar
                account={
                  <AccountHeader
                    account={result.body.profile}
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
    </main>
  )
}
export default HomePage
