import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ChatListPanel } from '@/features/chats/ui/ChatListPanel'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import { QueryProvider } from '@/features/conversation/ui/QueryProvider'
import { CHAT_FIXTURES } from '../chats/constants'
import { TEST_API_RESPONSE } from '../protocol.constants'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/features/conversation/application/create-connection-session', {
  spy: true,
})

const { scopeA } = CHAT_FIXTURES
const { OK } = TEST_API_RESPONSE
const sessions = () =>
  vi
    .mocked(createConnectionSession)
    .mock.results.filter((result) => result.type === 'return')
    .map((result) => result.value)

afterEach(async () => {
  cleanup()
  await Promise.all(sessions().map((session) => session.close()))
})

test('React query: empty success differs from loading', async () => {
  const pending = Promise.withResolvers<Response>()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => pending.promise),
  )
  render(
    <QueryProvider connectionScope={scopeA}>
      <ChatListPanel onSelect={() => undefined} />
    </QueryProvider>,
  )
  expect(screen.getByText('Загружаем чаты…')).toBeInTheDocument()
  expect(screen.queryByText('Пока нет чатов')).not.toBeInTheDocument()
  await act(async () => {
    pending.resolve(
      Response.json({ status: OK, connectionScope: scopeA, chats: [] }),
    )
  })
  expect(await screen.findByText('Пока нет чатов')).toBeInTheDocument()
  expect(screen.queryByText('Загружаем чаты…')).not.toBeInTheDocument()
})
