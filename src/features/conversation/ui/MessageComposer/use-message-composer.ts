'use client'

import { useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, SubmitEvent } from 'react'
import { useChatHistory } from '@/features/conversation/history/ui/use-chat-history'
import { matchesEditorSnapshot } from '@/features/conversation/sending/model/editor-guards'
import type { MessageEditor } from '@/features/conversation/sending/model/editor-guards'
import { useConversationSelection } from '@/features/conversation/ui/ConversationSelectionProvider'
import { useMessageSend } from '@/features/conversation/ui/MessageSendProvider'
import { useNotificationConnection } from '@/features/conversation/ui/NotificationProvider'
import {
  SEND_CONFIG,
  SEND_OUTCOME,
  SEND_RESULT_KIND,
} from '@/features/conversation/sending/model/constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'
import { MESSAGE_COMPOSER_KEYS } from './constants'

const { UNKNOWN: OUTCOME_UNKNOWN } = SEND_OUTCOME
const { ACCEPTED: RESULT_ACCEPTED, ERROR: RESULT_ERROR } = SEND_RESULT_KIND
const { MAX_CODE_POINTS } = SEND_CONFIG
const { ENTER, IME_KEY_CODE } = MESSAGE_COMPOSER_KEYS

export const useMessageComposer = () => {
  const { target, selectionEpoch } = useConversationSelection()
  const { pendingAttempt, lastResult, send, clearResult } = useMessageSend()
  const connection = useNotificationConnection()
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const composing = useRef(false)
  const { refetch, isFetching } = useChatHistory(target?.chatId ?? null)
  const [editor, setEditor] = useState<MessageEditor>(() => ({
    chatId: target?.chatId ?? null,
    selectionEpoch,
    revision: 0,
    text: EMPTY_STRING,
    historyChecked: false,
  }))
  if (editor.selectionEpoch !== selectionEpoch)
    setEditor({
      chatId: target?.chatId ?? null,
      selectionEpoch,
      revision: editor.revision + 1,
      text: EMPTY_STRING,
      historyChecked: false,
    })
  const matchingResult =
    lastResult &&
    matchesEditorSnapshot({ editor, snapshot: lastResult.snapshot })
  const failed = Boolean(matchingResult && lastResult?.kind === RESULT_ERROR)
  const unknown =
    failed &&
    lastResult?.kind === RESULT_ERROR &&
    lastResult.outcome === OUTCOME_UNKNOWN
  const tooLong = Array.from(editor.text).length > MAX_CODE_POINTS
  const fieldPending =
    pendingAttempt !== null && pendingAttempt.target.chatId === target?.chatId
  const blocked =
    !target ||
    !connection.canSend ||
    pendingAttempt !== null ||
    editor.text.trim().length === 0 ||
    tooLong ||
    (unknown && !editor.historyChecked)
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.currentTarget.value
    clearResult()
    setEditor((previous) => ({
      ...previous,
      text,
      revision: previous.revision + 1,
      historyChecked: false,
    }))
  }
  const submit = async () => {
    if (!target) return
    const unavailable = blocked || composing.current
    if (unavailable) return
    const result = await send({
      target,
      text: editor.text,
      selectionEpoch,
      editorRevision: editor.revision,
    })
    if (result?.kind !== RESULT_ACCEPTED) return
    setEditor((previous) =>
      matchesEditorSnapshot({ editor: previous, snapshot: result.snapshot })
        ? {
            ...previous,
            text: EMPTY_STRING,
            revision: previous.revision + 1,
            historyChecked: false,
          }
        : previous,
    )
  }
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const sendKey =
      event.key === ENTER &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      !composing.current &&
      event.nativeEvent.keyCode !== IME_KEY_CODE
    if (!sendKey) return
    event.preventDefault()
    void submit()
  }
  const handleCompositionStart = () => {
    composing.current = true
  }
  const handleCompositionEnd = () => {
    composing.current = false
  }
  const handleCheckHistory = async () => {
    const captured = editor
    await refetch()
    setEditor((previous) =>
      previous.selectionEpoch === captured.selectionEpoch &&
      previous.revision === captured.revision
        ? { ...previous, historyChecked: true }
        : previous,
    )
  }

  return {
    target,
    editor,
    inputId,
    hintId,
    errorId,
    fieldPending,
    tooLong,
    failed,
    unknown: Boolean(unknown),
    blocked: Boolean(blocked),
    isFetching,
    handleChange,
    handleSubmit,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleCheckHistory,
  }
}
