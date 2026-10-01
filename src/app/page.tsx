import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'
import { RecipientSearchForm } from '@/components/RecipientSearchForm'
import { HOME_RESULT_KIND, IS_PRODUCTION } from '@/lib/auth/constants'
import { resolveHome } from '@/lib/auth/resolve-home'
import { openSession, readCredentials } from '@/lib/auth/session'
import { getStateInstance } from '@/lib/green-api/get-state'
import { ROUTES } from '@/lib/routes/constants'
import { HOME_COPY } from './constants'

const { HOME, LOGIN, END_SESSION } = ROUTES
const {
  LOGIN: REQUIRE_LOGIN,
  END_SESSION: END_CURRENT_SESSION,
  RETRY: RETRY_CHECK,
} = HOME_RESULT_KIND
const { RETRY, RETRY_LINK, LOGOUT } = HOME_COPY

const HomePage = async () => {
  const session = await openSession(
    await cookies(),
    process.env.SESSION_PASSWORD,
    IS_PRODUCTION,
  )
  const credentials = session && readCredentials(session)
  const result = await resolveHome(credentials, getStateInstance)

  if (result.kind === REQUIRE_LOGIN) redirect(LOGIN)
  if (result.kind === END_CURRENT_SESSION) redirect(END_SESSION)

  const content =
    result.kind === RETRY_CHECK ? (
      <>
        <p>{RETRY}</p>
        <a href={HOME}>{RETRY_LINK}</a>
      </>
    ) : (
      <RecipientSearchForm />
    )

  return (
    <main>
      {content}
      <LogoutButton label={LOGOUT} />
    </main>
  )
}

export default HomePage
