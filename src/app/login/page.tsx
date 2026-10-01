import { LoginForm } from '@/components/LoginForm'
import { LOGIN_COPY } from '@/components/LoginForm/constants'
import { AUTH_QUERY } from '@/lib/auth/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './LoginPage.module.scss'

const { HEADING, ACCESS_LOST: ACCESS_LOST_COPY } = LOGIN_COPY
const { ACCESS_LOST } = AUTH_QUERY
const { ROLE_STATUS } = HTML_VALUES

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams

  return (
    <div className={styles.page}>
      <main className={styles.login}>
        <h1 className={styles.login__title}>{HEADING}</h1>
        {reason === ACCESS_LOST && <p role={ROLE_STATUS}>{ACCESS_LOST_COPY}</p>}
        <LoginForm />
      </main>
    </div>
  )
}
