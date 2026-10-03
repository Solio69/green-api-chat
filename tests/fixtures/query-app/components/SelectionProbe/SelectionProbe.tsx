'use client'

import { StrictMode, useState } from 'react'
import { ChatListPanel } from '@/features/chats/ui'
import { RecipientSearchForm } from '@/features/recipients/ui'
import { EMPTY_STRING, HTML_VALUES } from '@/lib/ui/constants'
import { ChatWorkspace } from '@/components/ChatWorkspace'
import { useConversationSelection } from '@/components/ConversationSelectionProvider'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'
import {
  CONVERSATION_FIXTURES,
  SELECTION_PROBE_COPY,
  SELECTION_PROBE_IDS,
} from '../../../../constants'

const { targetA, scopeA, scopeB, messagesKey, knownMessage, lateResultDelay } =
  CONVERSATION_FIXTURES
const { FIRST, SECOND, CACHE, HISTORY_TARGET } = SELECTION_PROBE_IDS
const {
  OPEN,
  BACK,
  CLOSE,
  END_SESSION,
  SEED_MESSAGES,
  INSPECT_MESSAGES,
  SWITCH_SCOPE,
  HISTORY_PENDING,
  HISTORY_EMPTY,
  HISTORY_ERROR,
  HISTORY_KNOWN,
  HISTORY_LATE,
  EDITOR,
  EMPTY_REPLY,
  ERROR_REPLY,
  KNOWN_REPLY,
  LATE_REPLY,
} = SELECTION_PROBE_COPY
const { ROLE_STATUS } = HTML_VALUES

const SelectionConsumer = ({ id }: { id: string }) => {
  const { target, accessId, selectionEpoch, mobilePanel } =
    useConversationSelection()
  return (
    <output data-testid={id}>
      {JSON.stringify({ target, accessId, selectionEpoch, mobilePanel })}
    </output>
  )
}

const Controls = () => {
  const selection = useConversationSelection()
  const session = useOptionalQuerySession()
  const handleOpen = () => selection.openConversation(targetA)
  const handleBack = () => selection.showChatList()
  const handleClose = () => selection.closeConversation()
  // The session/Query hook owns completion and error state.
  const handleEnd = () => {
    void session?.close()
  }
  const handleSeed = () =>
    session?.client.setQueryData(messagesKey, [knownMessage])
  const handleInspect = () =>
    setCache(JSON.stringify(session?.client.getQueryData(messagesKey)))
  const [cache, setCache] = useState(EMPTY_STRING)
  return (
    <>
      <SelectionConsumer id={FIRST} />
      <SelectionConsumer id={SECOND} />
      <button onClick={handleOpen}>{OPEN}</button>
      <button onClick={handleBack}>{BACK}</button>
      <button onClick={handleClose}>{CLOSE}</button>
      <button onClick={handleEnd}>{END_SESSION}</button>
      <button onClick={handleSeed}>{SEED_MESSAGES}</button>
      <button onClick={handleInspect}>{INSPECT_MESSAGES}</button>
      <output data-testid={CACHE}>{cache}</output>
    </>
  )
}

const HistorySlot = () => {
  const { target, accessId, selectionEpoch } = useConversationSelection()
  const [result, setResult] = useState<string>(HISTORY_PENDING)
  const handleEmpty = () => setResult(HISTORY_EMPTY)
  const handleError = () => setResult(HISTORY_ERROR)
  const handleKnown = () => setResult(HISTORY_KNOWN)
  const handleLate = () =>
    setTimeout(() => setResult(HISTORY_LATE), lateResultDelay)
  return (
    <div>
      <output data-testid={HISTORY_TARGET}>
        {JSON.stringify({ chatId: target?.chatId, accessId, selectionEpoch })}
      </output>
      <p role={ROLE_STATUS}>{result}</p>
      <label>
        {EDITOR}
        <input key={selectionEpoch} />
      </label>
      <button onClick={handleEmpty}>{EMPTY_REPLY}</button>
      <button onClick={handleError}>{ERROR_REPLY}</button>
      <button onClick={handleKnown}>{KNOWN_REPLY}</button>
      <button onClick={handleLate}>{LATE_REPLY}</button>
    </div>
  )
}

export const SelectionProbe = () => {
  const [scope, setScope] = useState<string>(scopeA)
  const handleScope = () => setScope(scopeB)
  return (
    <StrictMode>
      <button onClick={handleScope}>{SWITCH_SCOPE}</button>
      <QueryProvider key={scope} connectionScope={scope}>
        <ChatWorkspace
          account={<Controls />}
          search={<RecipientSearchForm />}
          chatList={<ChatListPanel />}
          conversation={<HistorySlot />}
        />
      </QueryProvider>
    </StrictMode>
  )
}
