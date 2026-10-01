'use client'

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type SubmitEvent,
} from 'react'
import { CredentialField } from '@/components/CredentialField'
import { SubmitButton } from '@/components/SubmitButton'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import { ROUTES } from '@/lib/routes/constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import {
  LOGIN_COPY,
  LOGIN_ERROR_COPY,
  LOGIN_FIELD_ID_SUFFIX,
  LOGIN_LINKS,
} from './constants'
import styles from './LoginForm.module.scss'

const {
  REQUIRED_HINT,
  ID_LABEL,
  TOKEN_LABEL,
  ID_REQUIRED,
  TOKEN_REQUIRED,
  SHOW_TOKEN,
  HIDE_TOKEN,
  SUBMIT,
  SUBMITTING,
  HELP_QUESTION,
  CABINET_LABEL,
  NEW_TAB,
  NO_SCRIPT,
} = LOGIN_COPY
const { CABINET } = LOGIN_LINKS
const { LINK_TARGET_NEW_TAB, LINK_REL_EXTERNAL, ROLE_ALERT } = HTML_VALUES
const {
  INVALID_TOKEN,
  INVALID_INSTANCE,
  INVALID_UPSTREAM_RESPONSE,
  SERVICE_UNAVAILABLE,
} = API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { OK: HTTP_OK } = HTTP_STATUS
const { CONTENT_TYPE } = HTTP_HEADERS
const { POST: HTTP_POST } = HTTP_METHOD
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { HOME, LOGIN_API } = ROUTES
const { INSTANCE, TOKEN, INSTANCE_ERROR, TOKEN_ERROR } = LOGIN_FIELD_ID_SUFFIX

// SSR and the hydration snapshot keep native submission disabled until React is ready.
const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

const readErrorCode = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const { status, code } = value as Record<string, unknown>

  if (
    status !== RESPONSE_ERROR ||
    typeof code !== 'string' ||
    !Object.hasOwn(LOGIN_ERROR_COPY, code)
  )
    return null
  return code
}

export const LoginForm = () => {
  const formId = useId()
  const idInputId = `${formId}${INSTANCE}`
  const tokenInputId = `${formId}${TOKEN}`
  const idErrorId = `${formId}${INSTANCE_ERROR}`
  const tokenErrorId = `${formId}${TOKEN_ERROR}`
  const idInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)
  const requestPending = useRef(false)
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
  const [serverErrorCode, setServerErrorCode] = useState<string>(EMPTY_STRING)
  const { idInstance, apiTokenInstance } = values
  const isIdMissing = idInstance.trim().length === 0
  const isTokenMissing = apiTokenInstance.trim().length === 0
  const serverError =
    LOGIN_ERROR_COPY[serverErrorCode as keyof typeof LOGIN_ERROR_COPY] ??
    EMPTY_STRING
  let idError = EMPTY_STRING
  let tokenError = EMPTY_STRING

  if (hasSubmitted && isIdMissing) {
    idError = ID_REQUIRED
  } else if (serverErrorCode === INVALID_INSTANCE) {
    idError = serverError
  }

  if (hasSubmitted && isTokenMissing) {
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
  const tokenToggleLabel = isTokenVisible ? HIDE_TOKEN : SHOW_TOKEN

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

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
    try {
      const response = await fetch(LOGIN_API, {
        method: HTTP_POST,
        headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
        body: JSON.stringify(values),
        cache: NO_STORE,
      })
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        setServerErrorCode(INVALID_UPSTREAM_RESPONSE)
        return
      }
      if (
        response.status === HTTP_OK &&
        payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        (payload as Record<string, unknown>).status === RESPONSE_OK
      ) {
        window.location.assign(HOME)
        return
      }
      setServerErrorCode(readErrorCode(payload) ?? INVALID_UPSTREAM_RESPONSE)
    } catch {
      setServerErrorCode(SERVICE_UNAVAILABLE)
    } finally {
      requestPending.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <fieldset
        className={styles.form__fields}
        disabled={!isInteractive || isSubmitting}
      >
        <p className={styles.form__hint}>{REQUIRED_HINT}</p>
        <CredentialField
          id={idInputId}
          label={ID_LABEL}
          value={idInstance}
          onValueChange={handleIdInstanceChange}
          inputRef={idInputRef}
          errorId={idErrorId}
          error={idError}
        />
        <CredentialField
          id={tokenInputId}
          label={TOKEN_LABEL}
          value={apiTokenInstance}
          onValueChange={handleApiTokenInstanceChange}
          inputRef={tokenInputRef}
          errorId={tokenErrorId}
          error={tokenError}
          reveal={{
            isVisible: isTokenVisible,
            label: tokenToggleLabel,
            onToggle: handleTokenVisibilityToggle,
          }}
        />
        {generalError && (
          <p className={styles.form__error} role={ROLE_ALERT}>
            {generalError}
          </p>
        )}
        <SubmitButton label={isSubmitting ? SUBMITTING : SUBMIT} />
      </fieldset>
      <noscript>
        <p className={styles.form__error}>{NO_SCRIPT}</p>
      </noscript>
      <p className={styles.form__help}>
        <span className={styles.form__question}>{HELP_QUESTION}</span>
        <a
          className={styles.form__link}
          href={CABINET}
          target={LINK_TARGET_NEW_TAB}
          rel={LINK_REL_EXTERNAL}
        >
          {CABINET_LABEL}
        </a>
        <span className={styles.form__note}>{NEW_TAB}</span>
      </p>
    </form>
  )
}
