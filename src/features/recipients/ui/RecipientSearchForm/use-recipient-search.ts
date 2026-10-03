import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { SubmitEvent } from 'react'
import { requestRecipientSearch } from './request-recipient-search'
import type { SearchErrorCode, SearchMode } from './request-recipient-search'
import {
  formatRecipientLabel,
  parseSearchRequest,
  RECIPIENT_RESULT_KIND,
  RECIPIENT_SEARCH_MODE,
} from '@/features/recipients/model'
import type { RecipientSearchDisplayResult } from '@/features/recipients/ui/RecipientSearchResult'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { ROUTES } from '@/lib/routes/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { RECIPIENT_COPY, RECIPIENT_ERROR_COPY } from './constants'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { PHONE, USERNAME } = RECIPIENT_SEARCH_MODE
const { FOUND, NOT_FOUND } = RECIPIENT_RESULT_KIND
const { INVALID_REQUEST } = API_ERROR_CODE
const { LOGIN } = ROUTES
const {
  PHONE_LABEL,
  USERNAME_LABEL,
  PHONE_REQUIRED,
  PHONE_INVALID,
  USERNAME_REQUIRED,
  USERNAME_INVALID,
} = RECIPIENT_COPY

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export const useRecipientSearch = () => {
  const { openConversation } = useConversationSelection()
  const session = useOptionalQuerySession()
  const inputRef = useRef<HTMLInputElement>(null)
  const requestPending = useRef(false)
  const requestController = useRef<AbortController | null>(null)
  const requestEpoch = useRef(0)
  const mounted = useRef(true)
  const isInteractive = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
  const [mode, setMode] = useState<SearchMode>(PHONE)
  const [value, setValue] = useState(EMPTY_STRING)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<RecipientSearchDisplayResult | null>(
    null,
  )
  const [serverErrorCode, setServerErrorCode] = useState<
    SearchErrorCode | typeof EMPTY_STRING
  >(EMPTY_STRING)

  useEffect(() => {
    mounted.current = true
    const cancelPending = () => {
      requestEpoch.current += 1
      requestController.current?.abort()
      requestController.current = null
      requestPending.current = false
    }
    const unregister = session?.registerCleanup(cancelPending)
    return () => {
      mounted.current = false
      unregister?.()
      cancelPending()
    }
  }, [session])

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

  const selectMode = (nextMode: SearchMode) => {
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
    const controller = new AbortController()
    requestController.current = controller
    const epoch = requestEpoch.current
    try {
      const outcome = await requestRecipientSearch({
        mode,
        value,
        signal: controller.signal,
      })
      const isCurrentOwner =
        mounted.current &&
        epoch === requestEpoch.current &&
        (session?.isActive() ?? true)
      if (!isCurrentOwner) return
      if (outcome.kind === 'access-lost') {
        window.location.assign(LOGIN)
        return
      }
      if (outcome.kind === FOUND) {
        setResult({ ...outcome, label: formatRecipientLabel(parsedInput) })
        return
      }
      if (outcome.kind === NOT_FOUND) {
        setResult(outcome)
        return
      }
      setServerErrorCode(outcome.code)
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        requestPending.current = false
        const isCurrentOwner = mounted.current && epoch === requestEpoch.current
        if (isCurrentOwner) setIsSubmitting(false)
      }
    }
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    void search(event)
  }
  const handleWrite = () => {
    if (result?.kind !== FOUND || (session && !session.isActive())) return
    openConversation({ chatId: result.chatId, label: result.label })
  }
  return {
    inputRef,
    isInteractive,
    isPhone,
    fieldLabel,
    value,
    fieldError,
    generalError,
    isSubmitting,
    result,
    handlePhoneModeSelect,
    handleUsernameModeSelect,
    handleValueChange,
    handleSubmit,
    handleWrite,
  }
}
