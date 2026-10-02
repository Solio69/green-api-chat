import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getQueryScope } from '@/lib/auth/get-query-scope'
import { resolveHome } from '@/lib/auth/resolve-home'
import {
  hasSessionPassword,
  openSession,
  readCredentials,
} from '@/lib/auth/session'
import { getAccountSettings } from '@/lib/green-api/get-account-settings'
import { HOME_RESULT_KIND, IS_PRODUCTION } from '@/lib/auth/constants'
import { ROUTES } from '@/lib/routes/constants'
import { HOME_COPY } from './constants'
import { AccountHeader } from '@/components/AccountHeader'
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel'
import { ChatListPanel } from '@/components/ChatListPanel'
import { ChatWorkspace } from '@/components/ChatWorkspace'
import { LogoutButton } from '@/components/LogoutButton'
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
  const password = process.env.SESSION_PASSWORD
  const session = await openSession({
    store: await cookies(),
    password,
    production: IS_PRODUCTION,
  })
  const credentials = session && readCredentials({ session })
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
  if (!session) redirect(LOGIN)
  if (!hasSessionPassword(password)) redirect(LOGIN)
  const connectionScope = getQueryScope({ session, password })
  return (
    <main className={styles.homePage}>
      <QueryProvider key={connectionScope} connectionScope={connectionScope}>
        <ChatWorkspace
          account={
            <AccountHeader account={result.body.profile} logoutLabel={LOGOUT} />
          }
          search={<RecipientSearchForm />}
          chatList={<ChatListPanel />}
          conversation={<ChatHistoryPanel />}
        />
      </QueryProvider>
    </main>
  )
}
export default HomePage
