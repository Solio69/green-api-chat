'use client'

import { useId, useRef, useState, useSyncExternalStore } from 'react'
import type { SubmitEvent } from 'react'
import { RecipientSearchField } from '@/components/RecipientSearchField'
import { SubmitButton } from '@/components/SubmitButton'
import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  CACHE_CONTROL,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@/lib/http/constants'
import {
  RECIPIENT_RESULT_KIND,
  RECIPIENT_SEARCH_MODE,
} from '@/lib/recipients/constants'
import { parseSearchRequest } from '@/lib/recipients/validate-search'
import { ROUTES } from '@/lib/routes/constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import {
  RECIPIENT_COPY,
  RECIPIENT_ERROR_COPY,
  RECIPIENT_FIELD_ID_SUFFIX,
} from './constants'
import styles from './RecipientSearchForm.module.scss'

const {
  HEADING,
  MODE_LABEL,
  PHONE_MODE,
  USERNAME_MODE,
  PHONE_LABEL,
  USERNAME_LABEL,
  PHONE_HINT,
  SUBMIT,
  SUBMITTING,
  PHONE_REQUIRED,
  PHONE_INVALID,
  USERNAME_REQUIRED,
  USERNAME_INVALID,
  FOUND: FOUND_COPY,
  CHAT_ID_LABEL,
  PHONE_NOT_FOUND,
  USERNAME_NOT_FOUND,
  SWITCH_TO_USERNAME,
  NO_SCRIPT,
} = RECIPIENT_COPY
const { FIELD, ERROR } = RECIPIENT_FIELD_ID_SUFFIX
const { PHONE, USERNAME } = RECIPIENT_SEARCH_MODE
const { FOUND, NOT_FOUND } = RECIPIENT_RESULT_KIND
const { INVALID_REQUEST, INVALID_UPSTREAM_RESPONSE, SERVICE_UNAVAILABLE } =
  API_ERROR_CODE
const { OK: RESPONSE_OK, ERROR: RESPONSE_ERROR } = API_RESPONSE_STATUS
const { OK: HTTP_OK, UNAUTHORIZED: HTTP_UNAUTHORIZED } = HTTP_STATUS
const { POST: HTTP_POST } = HTTP_METHOD
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { NO_STORE } = CACHE_CONTROL
const { RECIPIENT_SEARCH_API, LOGIN } = ROUTES
const { BUTTON, ROLE_ALERT, ROLE_STATUS, ROLE_GROUP } = HTML_VALUES

type SearchResult =
  { kind: typeof FOUND; chatId: string } | { kind: typeof NOT_FOUND }

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

const readSearchResult = (value: unknown): SearchResult | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { status, result, chatId } = value as Record<string, unknown>
  if (status !== RESPONSE_OK) return null
  if (result === FOUND && typeof chatId === 'string' && chatId.trim())
    return { kind: FOUND, chatId }
  if (result === NOT_FOUND) return { kind: NOT_FOUND }
  return null
}

const readErrorCode = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { status, code } = value as Record<string, unknown>
  if (status !== RESPONSE_ERROR || typeof code !== 'string') return null
  if (code === INVALID_REQUEST) return code
  if (Object.hasOwn(RECIPIENT_ERROR_COPY, code)) return code
  return null
}

export const RecipientSearchForm = () => {
  const formId = useId()
  const inputId = `${formId}${FIELD}`
  const errorId = `${formId}${ERROR}`
  const inputRef = useRef<HTMLInputElement>(null)
  const requestPending = useRef(false)
  const isInteractive = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
  const [mode, setMode] = useState<typeof PHONE | typeof USERNAME>(PHONE)
  const [value, setValue] = useState(EMPTY_STRING)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [serverErrorCode, setServerErrorCode] = useState(EMPTY_STRING)

  const isPhone = mode === PHONE
  const fieldLabel = isPhone ? PHONE_LABEL : USERNAME_LABEL
  const parsedInput = parseSearchRequest({ mode, value })
  let fieldError = EMPTY_STRING
  if (hasSubmitted && !parsedInput) {
    if (value.trim().length === 0)
      fieldError = isPhone ? PHONE_REQUIRED : USERNAME_REQUIRED
    else fieldError = isPhone ? PHONE_INVALID : USERNAME_INVALID
  }
  if (serverErrorCode === INVALID_REQUEST)
    fieldError = isPhone ? PHONE_INVALID : USERNAME_INVALID
  const generalError =
    RECIPIENT_ERROR_COPY[
      serverErrorCode as keyof typeof RECIPIENT_ERROR_COPY
    ] ?? EMPTY_STRING

  const selectMode = (nextMode: typeof PHONE | typeof USERNAME) => {
    if (requestPending.current) return
    setMode(nextMode)
    setValue(EMPTY_STRING)
    setHasSubmitted(false)
    setResult(null)
    setServerErrorCode(EMPTY_STRING)
  }

  const handlePhoneModeSelect = () => selectMode(PHONE)

  const handleUsernameModeSelect = () => selectMode(USERNAME)

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue)
    setResult(null)
    setServerErrorCode(EMPTY_STRING)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (requestPending.current) return
    setHasSubmitted(true)
    if (!parsedInput) {
      inputRef.current?.focus()
      return
    }

    requestPending.current = true
    setIsSubmitting(true)
    setResult(null)
    setServerErrorCode(EMPTY_STRING)
    try {
      const response = await fetch(RECIPIENT_SEARCH_API, {
        method: HTTP_POST,
        headers: { [CONTENT_TYPE]: JSON_CONTENT_TYPE },
        body: JSON.stringify({ mode, value }),
        cache: NO_STORE,
      })
      if (response.status === HTTP_UNAUTHORIZED) {
        window.location.assign(LOGIN)
        return
      }
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        setServerErrorCode(INVALID_UPSTREAM_RESPONSE)
        return
      }
      const searchResult = readSearchResult(payload)
      if (response.status === HTTP_OK && searchResult) {
        setResult(searchResult)
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
    <section className={styles.recipientSearchForm}>
      <h1 className={styles.recipientSearchForm__heading}>{HEADING}</h1>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset
          className={styles.recipientSearchForm__fields}
          disabled={!isInteractive || isSubmitting}
        >
          <div
            className={styles.recipientSearchForm__modes}
            role={ROLE_GROUP}
            aria-label={MODE_LABEL}
          >
            <button
              className={styles.recipientSearchForm__mode}
              type={BUTTON}
              aria-pressed={isPhone}
              onClick={handlePhoneModeSelect}
            >
              {PHONE_MODE}
            </button>
            <button
              className={styles.recipientSearchForm__mode}
              type={BUTTON}
              aria-pressed={!isPhone}
              onClick={handleUsernameModeSelect}
            >
              {USERNAME_MODE}
            </button>
          </div>
          <RecipientSearchField
            id={inputId}
            errorId={errorId}
            label={fieldLabel}
            value={value}
            error={fieldError}
            isPhone={isPhone}
            inputRef={inputRef}
            onValueChange={handleValueChange}
          />
          {isPhone && (
            <p className={styles.recipientSearchForm__hint}>{PHONE_HINT}</p>
          )}
          {generalError && (
            <p className={styles.recipientSearchForm__error} role={ROLE_ALERT}>
              {generalError}
            </p>
          )}
          <SubmitButton label={isSubmitting ? SUBMITTING : SUBMIT} />
        </fieldset>
      </form>
      <noscript>
        <p className={styles.recipientSearchForm__error}>{NO_SCRIPT}</p>
      </noscript>
      {result && (
        <div className={styles.recipientSearchForm__result} role={ROLE_STATUS}>
          {result.kind === FOUND ? (
            <>
              <p>{FOUND_COPY}</p>
              <p>{`${CHAT_ID_LABEL}: ${result.chatId}`}</p>
            </>
          ) : (
            <>
              <p>{isPhone ? PHONE_NOT_FOUND : USERNAME_NOT_FOUND}</p>
              {isPhone && (
                <button
                  className={styles.recipientSearchForm__switch}
                  type={BUTTON}
                  onClick={handleUsernameModeSelect}
                >
                  {SWITCH_TO_USERNAME}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
