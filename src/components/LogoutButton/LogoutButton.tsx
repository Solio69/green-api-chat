'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, type SubmitEvent } from 'react'
import { CACHE_CONTROL, HTTP_METHOD } from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'
import { HTML_VALUES } from '@/lib/ui/constants'
import { LOGOUT_COPY } from './constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'
import styles from './LogoutButton.module.scss'

const { POST } = HTTP_METHOD
const { NO_STORE } = CACHE_CONTROL
const { LOGIN, LOGOUT_API } = ROUTES
const { SUBMIT, ROLE_ALERT } = HTML_VALUES
const { ERROR } = LOGOUT_COPY

type LogoutButtonProps = {
  label: string
}

export const LogoutButton = ({ label }: LogoutButtonProps) => {
  const router = useRouter()
  const querySession = useOptionalQuerySession()
  const requestPending = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLogoutSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestPending.current) return
    requestPending.current = true
    setIsSubmitting(true)
    setHasError(false)
    try {
      const response = await fetch(LOGOUT_API, {
        method: POST,
        cache: NO_STORE,
      })
      if (!response.ok) {
        setHasError(true)
        return
      }
      await querySession?.close()
      router.replace(LOGIN)
      router.refresh()
    } catch {
      setHasError(true)
    } finally {
      requestPending.current = false
      setIsSubmitting(false)
    }
  }

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
