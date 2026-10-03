'use client'

import { StrictMode, useState } from 'react'
import { HistoryFactsProbe } from '../HistoryFactsProbe'
import { useChatHistory } from '@/lib/history/use-chat-history'
import { HTML_VALUES } from '@/lib/ui/constants'
import { ChatHistoryPanel } from '@/components/ChatHistoryPanel'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/components/ConversationSelectionProvider'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'
import { HISTORY_TEST } from '../../../../history/constants'
import styles from './HistoryProbe.module.scss'

const {
  scopeA,
  scopeB,
  TARGET_A,
  TARGET_B,
  BUTTON_OPEN_A,
  BUTTON_OPEN_B,
  BUTTON_BACK,
  BUTTON_CLOSE,
  BUTTON_END,
  BUTTON_REFRESH,
  BUTTON_SCOPE,
  FIRST,
  SECOND,
} = HISTORY_TEST
const { BUTTON } = HTML_VALUES
const HistoryConsumer = ({ id }: { id: string }) => {
  const { target } = useConversationSelection()
  const result = useChatHistory(target?.chatId ?? null)
  return (
    <output data-testid={id}>
      {JSON.stringify({
        data: result.data ?? null,
        pending: result.isPending,
        fetching: result.isFetching,
        error: result.error?.code ?? null,
      })}
    </output>
  )
}
const HistoryControls = () => {
  const { target, openConversation, showChatList, closeConversation } =
    useConversationSelection()
  const session = useOptionalQuerySession()
  const { refetch } = useChatHistory(target?.chatId ?? null)
  const handleOpenA = () => openConversation(TARGET_A)
  const handleOpenB = () => openConversation(TARGET_B)
  const handleBack = () => showChatList()
  const handleClose = () => closeConversation()
  // The session/Query hook owns completion and error state.
  const handleEnd = () => {
    void session?.close()
  }
  // The session/Query hook owns completion and error state.
  const handleRefresh = () => {
    void refetch()
  }
  return (
    <>
      <button type={BUTTON} onClick={handleOpenA}>
        {BUTTON_OPEN_A}
      </button>
      <button type={BUTTON} onClick={handleOpenB}>
        {BUTTON_OPEN_B}
      </button>
      <button type={BUTTON} onClick={handleBack}>
        {BUTTON_BACK}
      </button>
      <button type={BUTTON} onClick={handleClose}>
        {BUTTON_CLOSE}
      </button>
      <button type={BUTTON} onClick={handleEnd}>
        {BUTTON_END}
      </button>
      <button type={BUTTON} onClick={handleRefresh}>
        {BUTTON_REFRESH}
      </button>
      <HistoryConsumer id={FIRST} />
      <HistoryConsumer id={SECOND} />
      <HistoryFactsProbe />
      <div className={styles.historyProbe__conversation}>
        <ChatHistoryPanel />
      </div>
    </>
  )
}
export const HistoryProbe = () => {
  const [scope, setScope] = useState<string>(scopeA)
  const handleScope = () => setScope(scopeB)
  return (
    <>
      <button type={BUTTON} onClick={handleScope}>
        {BUTTON_SCOPE}
      </button>
      <StrictMode>
        <QueryProvider key={scope} connectionScope={scope}>
          <ConversationSelectionProvider>
            <HistoryControls />
          </ConversationSelectionProvider>
        </QueryProvider>
      </StrictMode>
    </>
  )
}
