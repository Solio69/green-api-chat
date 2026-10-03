import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { requestLogout } from './request-logout'
import { useOptionalNotificationOwner } from '@/features/conversation/ui/NotificationProvider'
import { ROUTES } from '@/lib/routes/constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { LOGIN } = ROUTES

export const useLogout = () => {
  const router = useRouter()
  const owner = useOptionalNotificationOwner()
  const querySession = useOptionalQuerySession()
  const requestPending = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasError, setHasError] = useState(false)

  const logout = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestPending.current) return
    requestPending.current = true
    setIsSubmitting(true)
    setHasError(false)
    try {
      const succeeded = await requestLogout({
        headers: owner?.getOwnedHeaders() ?? undefined,
      })
      if (!succeeded) {
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

  // The operation handles request errors and resets pending state internally.
  const handleLogoutSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    void logout(event)
  }

  return { isSubmitting, hasError, handleLogoutSubmit }
}
