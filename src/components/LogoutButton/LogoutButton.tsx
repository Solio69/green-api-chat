import { HTTP_METHOD } from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import styles from './LogoutButton.module.scss'

const { POST } = HTTP_METHOD
const { LOGOUT_API } = ROUTES
const { SUBMIT } = HTML_VALUES

type LogoutButtonProps = {
  label: string
}

export const LogoutButton = ({ label }: LogoutButtonProps) => (
  <form className={styles.logoutButton} action={LOGOUT_API} method={POST}>
    <button className={styles.logoutButton__control} type={SUBMIT}>
      {label}
    </button>
  </form>
)
