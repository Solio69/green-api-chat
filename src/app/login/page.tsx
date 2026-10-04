import { AUTH_QUERY } from '@/features/auth/model'
import { LOGIN_COPY, LoginForm } from '@/features/auth/ui'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import styles from './LoginPage.module.scss'

const { HEADING, ACCESS_LOST: ACCESS_LOST_COPY } = LOGIN_COPY
const { ACCESS_LOST } = AUTH_QUERY
const { ROLE_STATUS } = HTML_VALUES

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
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

export default LoginPage
