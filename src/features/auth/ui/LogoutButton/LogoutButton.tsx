'use client'

import { useLogout } from './use-logout'
import { HTTP_METHOD } from '@/shared/kernel/http/constants'
import { ROUTES } from '@/shared/kernel/routes/constants'
import { HTML_VALUES } from '@/shared/kernel/ui/constants'
import { LOGOUT_COPY } from './constants'
import styles from './LogoutButton.module.scss'

const { POST } = HTTP_METHOD
const { LOGOUT_API } = ROUTES
const { SUBMIT, ROLE_ALERT } = HTML_VALUES
const { ERROR } = LOGOUT_COPY

type LogoutButtonProps = {
  label: string
}

export const LogoutButton = ({ label }: LogoutButtonProps) => {
  const { isSubmitting, hasError, handleLogoutSubmit } = useLogout()

  return (
    <form
      className={styles.logoutButton}
      action={LOGOUT_API}
      method={POST}
      onSubmit={handleLogoutSubmit}
    >
      <button
        className={styles.logoutButton__control}
        type={SUBMIT}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        <svg
          className={styles.logoutButton__icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M9 5H5v14h4M13 8l4 4-4 4M9 12h12" />
        </svg>
        {label}
      </button>
      {hasError && (
        <p className={styles.logoutButton__error} role={ROLE_ALERT}>
          {ERROR}
        </p>
      )}
    </form>
  )
}
