'use client'

import { StrictMode, useState } from 'react'
import { useChats } from '@/lib/chats/use-chats'
import { ChatListPanel } from '@/components/ChatListPanel'
import { LogoutButton } from '@/components/LogoutButton'
import { QueryProvider } from '@/components/QueryProvider'

const Consumer = ({ id }: { id: string }) => {
  const { data, isPending, isFetching, error, refetch } = useChats()
  const handleRefetch = () => refetch()
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
      <button onClick={handleRefetch}>Обновить</button>
    </section>
  )
}
export const QueryProbe = () => {
  const [scope, setScope] = useState('a'.repeat(43))
  const [mounted, setMounted] = useState(true)
  const [strict, setStrict] = useState(false)
  const [revision, setRevision] = useState(0)
  const handleSwitch = () => setScope('b'.repeat(43))
  const handleToggle = () => setMounted((value) => !value)
  const handleStrict = () => setStrict(true)
  const handleRender = () => setRevision((value) => value + 1)
  const content = (
    <QueryProvider key={scope} connectionScope={scope}>
      {mounted && (
        <>
          <Consumer id="first" />
          <Consumer id="second" />
          <ChatListPanel />
        </>
      )}
      <LogoutButton label="Выйти" />
    </QueryProvider>
  )
  return (
    <>
      <button onClick={handleSwitch}>Аккаунт Б</button>
      <button onClick={handleToggle}>Потребители</button>
      <button onClick={handleStrict}>Strict Mode</button>
      <button onClick={handleRender}>Render {revision}</button>
      {strict ? <StrictMode>{content}</StrictMode> : content}
    </>
  )
}
