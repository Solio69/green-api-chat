import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { SubmitEvent } from 'react'
import { requestLogin } from './request-login'
import type { LoginErrorCode } from './request-login'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { ROUTES } from '@/lib/routes/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { LOGIN_COPY, LOGIN_ERROR_COPY } from './constants'

const { ID_REQUIRED, TOKEN_REQUIRED } = LOGIN_COPY
const { INVALID_TOKEN, INVALID_INSTANCE } = API_ERROR_CODE
const { HOME } = ROUTES

// SSR and the hydration snapshot keep native submission disabled until React is ready.
const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export const useLoginForm = () => {
  const router = useRouter()
  const idInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const requestPending = useRef(false)
  const requestController = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const isInteractive = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
  const [values, setValues] = useState({
    idInstance: EMPTY_STRING,
    apiTokenInstance: EMPTY_STRING,
  })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [serverErrorCode, setServerErrorCode] = useState<
    LoginErrorCode | typeof EMPTY_STRING
  >(EMPTY_STRING)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestController.current?.abort()
    }
  }, [])

  const { idInstance, apiTokenInstance } = values
  const isIdMissing = idInstance.trim().length === 0
  const isTokenMissing = apiTokenInstance.trim().length === 0
  const serverError = serverErrorCode
    ? LOGIN_ERROR_COPY[serverErrorCode]
    : EMPTY_STRING
  const hasIdError = hasSubmitted && isIdMissing
  const hasTokenError = hasSubmitted && isTokenMissing
  let idError = EMPTY_STRING
  let tokenError = EMPTY_STRING

  if (hasIdError) {
    idError = ID_REQUIRED
  } else if (serverErrorCode === INVALID_INSTANCE) {
    idError = serverError
  }
  if (hasTokenError) {
    tokenError = TOKEN_REQUIRED
  } else if (serverErrorCode === INVALID_TOKEN) {
    tokenError = serverError
  }
  const generalError =
    serverErrorCode &&
    serverErrorCode !== INVALID_TOKEN &&
    serverErrorCode !== INVALID_INSTANCE
      ? serverError
      : EMPTY_STRING

  const handleIdInstanceChange = (value: string) => {
    setValues((current) => ({ ...current, idInstance: value }))
    setServerErrorCode(EMPTY_STRING)
  }
  const handleApiTokenInstanceChange = (value: string) => {
    setValues((current) => ({ ...current, apiTokenInstance: value }))
    setServerErrorCode(EMPTY_STRING)
  }
  const handleTokenVisibilityToggle = () =>
    setIsTokenVisible((visible) => !visible)

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestPending.current) return
    setHasSubmitted(true)
    if (isIdMissing) {
      idInputRef.current?.focus()
      return
    }
    if (isTokenMissing) {
      tokenInputRef.current?.focus()
      return
    }

    requestPending.current = true
    setIsSubmitting(true)
    setServerErrorCode(EMPTY_STRING)
    const controller = new AbortController()
    requestController.current = controller
    try {
      const result = await requestLogin({
        credentials: values,
        signal: controller.signal,
      })
      if (!mounted.current) return
      if (result.kind === 'success') {
        router.replace(HOME)
        return
      }
      setServerErrorCode(result.code)
    } finally {
      requestController.current = null
      requestPending.current = false
      if (mounted.current) setIsSubmitting(false)
    }
  }

  // The operation handles request errors and resets pending state internally.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    void submit(event)
  }

  return {
    values,
    idInputRef,
    tokenInputRef,
    isInteractive,
    isSubmitting,
    isTokenVisible,
    idError,
    tokenError,
    generalError,
    handleIdInstanceChange,
    handleApiTokenInstanceChange,
    handleTokenVisibilityToggle,
    handleSubmit,
  }
}
