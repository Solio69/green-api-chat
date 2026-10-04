'use client'

import { StrictMode, useState } from 'react'
import { LogoutButton } from '@/features/auth/ui'
import { useChats } from '@/features/chats/ui'
import { ConversationChatListPanel } from '@/features/conversation/ui'
import { ConversationSelectionProvider } from '@/features/conversation/ui/ConversationSelectionProvider'
import { QueryProvider } from '@/features/conversation/ui/QueryProvider'
import { CHAT_FIXTURES } from '../../../../chats/constants'
import { QUERY_PROBE_COPY, QUERY_PROBE_IDS } from '../../../../constants'

const { scopeA, scopeB } = CHAT_FIXTURES
const { FIRST, SECOND } = QUERY_PROBE_IDS
const { REFRESH, SWITCH_ACCOUNT, CONSUMERS, STRICT_MODE, RENDER, LOGOUT } =
  QUERY_PROBE_COPY

const Consumer = ({ id }: { id: string }) => {
  const { data, isPending, isFetching, error, refetch } = useChats()
  // The session/Query hook owns completion and error state.
  const handleRefetch = () => {
    void refetch()
  }
  return (
    <section data-testid={id}>
      <output>
        {JSON.stringify({
          data,
          isPending,
          isFetching,
          error: error?.code ?? null,
        })}
      </output>
      <button onClick={handleRefetch}>{REFRESH}</button>
    </section>
  )
}
export const QueryProbe = () => {
  const [scope, setScope] = useState<string>(scopeA)
  const [mounted, setMounted] = useState(true)
  const [strict, setStrict] = useState(false)
  const [revision, setRevision] = useState(0)
  const handleSwitch = () => setScope(scopeB)
  const handleToggle = () => setMounted((value) => !value)
  const handleStrict = () => setStrict(true)
  const handleRender = () => setRevision((value) => value + 1)
  const content = (
    <QueryProvider key={scope} connectionScope={scope}>
      <ConversationSelectionProvider>
        {mounted && (
          <>
            <Consumer id={FIRST} />
            <Consumer id={SECOND} />
            <ConversationChatListPanel />
          </>
        )}
        <LogoutButton label={LOGOUT} />
      </ConversationSelectionProvider>
    </QueryProvider>
  )
  return (
    <>
      <button onClick={handleSwitch}>{SWITCH_ACCOUNT}</button>
      <button onClick={handleToggle}>{CONSUMERS}</button>
      <button onClick={handleStrict}>{STRICT_MODE}</button>
      <button onClick={handleRender}>
        {RENDER} {revision}
      </button>
      {strict ? <StrictMode>{content}</StrictMode> : content}
    </>
  )
}
