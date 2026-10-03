import { redirect } from 'next/navigation'
import { resolveHome } from '@/features/auth/application'
import { HOME_RESULT_KIND } from '@/features/auth/model'
import { getAccountSettings } from '@/lib/green-api/get-account-settings'
import { readPageSession } from '@/server/session'
import { ROUTES } from '@/lib/routes/constants'
import { HOME_COPY } from './constants'
import { AccountHeader } from '@/components/AccountHeader'
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel'
import { ChatListPanel } from '@/components/ChatListPanel'
import { ChatWorkspace } from '@/components/ChatWorkspace'
import { LogoutButton } from '@/components/LogoutButton'
import { MessageComposer } from '@/components/MessageComposer'
import { NotificationProvider } from '@/components/NotificationProvider'
import { QueryProvider } from '@/components/QueryProvider'
import { RecipientSearchForm } from '@/components/RecipientSearchForm'
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
    <main className={styles.homePage}>
      <QueryProvider key={connectionScope} connectionScope={connectionScope}>
        <NotificationProvider>
          <ChatWorkspace
            account={
              <AccountHeader
                account={result.body.profile}
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
    </main>
  )
}
export default HomePage
