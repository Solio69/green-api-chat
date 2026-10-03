'use client'

import { useId, useRef, useState, useSyncExternalStore } from 'react'
import type { SubmitEvent } from 'react'
import { formatRecipientLabel } from './format-recipient-label'
import { isRecord } from '@/lib/api/is-record'
import { parseSearchRequest } from '@/lib/recipients/validate-search'
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
import { ROUTES } from '@/lib/routes/constants'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import {
  RECIPIENT_COPY,
  RECIPIENT_ERROR_COPY,
  RECIPIENT_FIELD_ID_SUFFIX,
} from './constants'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import { RecipientSearchField } from '@/components/RecipientSearchField'
import { RecipientSearchHint } from '@/components/RecipientSearchHint'
import { RecipientSearchModeSwitch } from '@/components/RecipientSearchModeSwitch'
import { RecipientSearchResult } from '@/components/RecipientSearchResult'
import type { RecipientSearchDisplayResult } from '@/components/RecipientSearchResult'
import { SubmitButton } from '@/components/SubmitButton'
import styles from './RecipientSearchForm.module.scss'

const {
  HEADING,
  PHONE_LABEL,
  USERNAME_LABEL,
  PHONE_HINT,
  USERNAME_HINT,
  SUBMIT,
  SUBMITTING,
  PHONE_REQUIRED,
  PHONE_INVALID,
  USERNAME_REQUIRED,
  USERNAME_INVALID,
  NO_SCRIPT,
} = RECIPIENT_COPY
const { FIELD, ERROR, HINT } = RECIPIENT_FIELD_ID_SUFFIX
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
const { ROLE_STATUS } = HTML_VALUES

type SearchResult =
  { kind: typeof FOUND; chatId: string } | { kind: typeof NOT_FOUND }

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

const readSearchResult = (value: unknown): SearchResult | null => {
  if (!isRecord(value)) return null
  const { status, result, chatId } = value
  if (status !== RESPONSE_OK) return null
  const isFound =
    result === FOUND && typeof chatId === 'string' && chatId.trim().length > 0
  if (isFound) return { kind: FOUND, chatId }
  if (result === NOT_FOUND) return { kind: NOT_FOUND }
  return null
}

type SearchErrorCode =
  keyof typeof RECIPIENT_ERROR_COPY | typeof INVALID_REQUEST

const isSearchErrorCode = (value: unknown): value is SearchErrorCode => {
  const isKnownCode =
    typeof value === 'string' &&
    (value === INVALID_REQUEST || Object.hasOwn(RECIPIENT_ERROR_COPY, value))
  return isKnownCode
}

const readErrorCode = (value: unknown): SearchErrorCode | null => {
  if (!isRecord(value)) return null
  const { status, code } = value
  const isKnownError = status === RESPONSE_ERROR && isSearchErrorCode(code)
  return isKnownError ? code : null
}

export const RecipientSearchForm = () => {
  const { openConversation } = useConversationSelection()
  const formId = useId()
  const inputId = `${formId}${FIELD}`
  const hintId = `${formId}${HINT}`
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
  const [result, setResult] = useState<RecipientSearchDisplayResult | null>(
    null,
  )
  const [serverErrorCode, setServerErrorCode] = useState<
    SearchErrorCode | typeof EMPTY_STRING
  >(EMPTY_STRING)

  const isPhone = mode === PHONE
  const fieldLabel = isPhone ? PHONE_LABEL : USERNAME_LABEL
  const parsedInput = parseSearchRequest({ mode, value })
  let fieldError = EMPTY_STRING
  const hasLocalError = hasSubmitted && !parsedInput
  if (hasLocalError) {
    if (value.trim().length === 0)
      fieldError = isPhone ? PHONE_REQUIRED : USERNAME_REQUIRED
    else fieldError = isPhone ? PHONE_INVALID : USERNAME_INVALID
  }
  if (serverErrorCode === INVALID_REQUEST)
    fieldError = isPhone ? PHONE_INVALID : USERNAME_INVALID
  const hasGeneralError =
    serverErrorCode !== EMPTY_STRING && serverErrorCode !== INVALID_REQUEST
  const generalError = hasGeneralError
    ? RECIPIENT_ERROR_COPY[serverErrorCode]
    : EMPTY_STRING

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

  const search = async (event: SubmitEvent<HTMLFormElement>) => {
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
      const isSuccessfulSearch = response.status === HTTP_OK && searchResult
      if (isSuccessfulSearch) {
        setResult(
          searchResult.kind === FOUND
            ? { ...searchResult, label: formatRecipientLabel(parsedInput) }
            : searchResult,
        )
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

  // The operation handles request errors and resets pending state internally.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    void search(event)
  }

  const handleWrite = () => {
    if (result?.kind !== FOUND) return
    openConversation({ chatId: result.chatId, label: result.label })
  }

  return (
    <section className={styles.recipientSearchForm}>
      <h1 className={styles.recipientSearchForm__heading}>{HEADING}</h1>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset
          className={styles.recipientSearchForm__fields}
          disabled={!isInteractive || isSubmitting}
        >
          <RecipientSearchModeSwitch
            isPhone={isPhone}
            onPhoneSelect={handlePhoneModeSelect}
            onUsernameSelect={handleUsernameModeSelect}
          />
          <div className={styles.recipientSearchForm__row}>
            <RecipientSearchField
              id={inputId}
              errorId={errorId}
              hintId={hintId}
              label={fieldLabel}
              alternateLabel={isPhone ? USERNAME_LABEL : PHONE_LABEL}
              value={value}
              error={fieldError}
              isPhone={isPhone}
              inputRef={inputRef}
              onValueChange={handleValueChange}
            />
            <div className={styles.recipientSearchForm__submit}>
              <SubmitButton
                label={isSubmitting ? SUBMITTING : SUBMIT}
                isLoading={isSubmitting}
              />
            </div>
          </div>
          <div className={styles.recipientSearchForm__hints} id={hintId}>
            <RecipientSearchHint text={PHONE_HINT} isHidden={!isPhone} />
            <RecipientSearchHint text={USERNAME_HINT} isHidden={isPhone} />
          </div>
        </fieldset>
        <p className={styles.recipientSearchForm__pending} role={ROLE_STATUS}>
          {isSubmitting ? SUBMITTING : EMPTY_STRING}
        </p>
      </form>
      <noscript>
        <p className={styles.recipientSearchForm__error}>{NO_SCRIPT}</p>
      </noscript>
      <RecipientSearchResult
        result={result}
        error={generalError}
        isPhone={isPhone}
        onUsernameSelect={handleUsernameModeSelect}
        onWrite={handleWrite}
      />
    </section>
  )
}
