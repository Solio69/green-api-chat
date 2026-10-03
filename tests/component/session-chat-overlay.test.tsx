import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { SESSION_CHAT_TEST } from '../chats/session-constants'
import { rememberPersonalChat } from '@/features/chats/application'
import { useChats } from '@/features/chats/ui'
import { ConversationChatListPanel } from '@/features/conversation/ui'
import { ConversationSelectionProvider } from '@/features/conversation/ui/ConversationSelectionProvider'
import { createConnectionSession } from '@/lib/conversations/create-connection-session'
import { HISTORY_TEST } from '../history/constants'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/conversations/create-connection-session', { spy: true })

const { scopeA, chatA } = HISTORY_TEST
const { LABEL, ADD, REFRESH, SOURCE } = SESSION_CHAT_TEST
const { ACCEPTED } = SOURCE
const sessions = () =>
  vi
    .mocked(createConnectionSession)
    .mock.results.filter((result) => result.type === 'return')
    .map((result) => result.value)

const OverlayControls = () => {
  const session = useOptionalQuerySession()
  const { refetch } = useChats()
  return (
    <>
      <button
        onClick={() => {
          if (session)
            rememberPersonalChat({
              session,
              chatId: chatA,
              label: LABEL,
              source: ACCEPTED,
            })
        }}
      >
        {ADD}
      </button>
      <button onClick={() => void refetch()}>{REFRESH}</button>
      <ConversationChatListPanel />
    </>
  )
}

afterEach(async () => {
  cleanup()
  await Promise.all(sessions().map((session) => session.close()))
})

test('session overlay: a pending known chat remains visible after empty and failed list refresh', async () => {
  let fail = false
  let calls = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      calls += 1
      return fail
        ? Response.json(
            { status: 'error', code: 'service_unavailable' },
            { status: 503 },
          )
        : Response.json({ status: 'ok', connectionScope: scopeA, chats: [] })
    }),
  )
  const user = userEvent.setup()
  render(
    <QueryProvider connectionScope={scopeA}>
      <ConversationSelectionProvider>
        <OverlayControls />
      </ConversationSelectionProvider>
    </QueryProvider>,
  )
  expect(await screen.findByText('Пока нет чатов')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: ADD }))
  expect(screen.getByRole('button', { name: LABEL })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: REFRESH }))
  await waitFor(() => expect(calls).toBe(2))
  expect(screen.getByRole('button', { name: LABEL })).toBeInTheDocument()
  fail = true
  await user.click(screen.getByRole('button', { name: REFRESH }))
  expect(
    await screen.findByText('Не удалось загрузить чаты'),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: LABEL })).toBeInTheDocument()
})
