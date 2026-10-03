import { useQuery } from '@tanstack/react-query'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { ChatHistoryState } from '@/features/conversation/ui/ChatHistoryState'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/features/conversation/ui/ConversationSelectionProvider'
import { MessageComposer } from '@/features/conversation/ui/MessageComposer'
import { createConnectionSession } from '@/lib/conversations/create-connection-session'
import { useChatHistory } from '@/lib/history/use-chat-history'
import { CONVERSATION_FIXTURES } from '../conversation.constants'
import { HISTORY_TEST } from '../history/constants'
import {
  QueryProvider,
  useOptionalQuerySession,
} from '@/components/QueryProvider'

const sendBoundary = vi.hoisted(() => ({
  send: vi.fn(async () => null),
  clearResult: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/lib/conversations/create-connection-session', { spy: true })
vi.mock('@/features/conversation/ui/MessageSendProvider', () => ({
  useMessageSend: () => ({
    pendingAttempt: null,
    lastResult: null,
    send: sendBoundary.send,
    clearResult: sendBoundary.clearResult,
  }),
}))
vi.mock('@/features/conversation/ui/NotificationProvider', () => ({
  useNotificationConnection: () => ({ canSend: true }),
}))

const { scopeA, scopeB, chatA, chatB, TARGET_A, TARGET_B } = HISTORY_TEST
const { draftA, draftB } = CONVERSATION_FIXTURES
const knownKey = ['selection-known-message']
const sessions = () =>
  vi
    .mocked(createConnectionSession)
    .mock.results.filter((result) => result.type === 'return')
    .map((result) => result.value)

const HistorySubscriber = () => {
  const { target } = useConversationSelection()
  useChatHistory(target?.chatId ?? null)
  return null
}
const SelectionConsumer = ({ name }: { name: string }) => {
  const { target } = useConversationSelection()
  return <section aria-label={name}>{target?.label ?? 'Не выбрана'}</section>
}
const SelectionControls = ({
  withComposer = false,
}: {
  withComposer?: boolean
}) => {
  const selection = useConversationSelection()
  const session = useOptionalQuerySession()
  const { data } = useQuery<string>({ queryKey: knownKey, enabled: false })
  return (
    <>
      <button onClick={() => selection.openConversation(TARGET_A)}>
        Открыть А
      </button>
      <button onClick={() => selection.openConversation(TARGET_B)}>
        Открыть Б
      </button>
      <button onClick={selection.showChatList}>Назад</button>
      <button onClick={selection.closeConversation}>Закрыть</button>
      <button
        onClick={() =>
          session?.client.setQueryData(knownKey, 'Известное сообщение')
        }
      >
        Запомнить
      </button>
      <button onClick={() => void session?.close()}>Завершить сеанс</button>
      <p>Сохранённые данные: {data ?? 'нет'}</p>
      <SelectionConsumer name="Первый получатель" />
      <SelectionConsumer name="Второй получатель" />
      <HistorySubscriber />
      <HistorySubscriber />
      {withComposer && <MessageComposer />}
    </>
  )
}
const SelectionHost = ({
  withComposer = false,
}: {
  withComposer?: boolean
}) => {
  const [scope, setScope] = useState<string>(scopeA)
  return (
    <>
      <button onClick={() => setScope(scopeB)}>Сменить подключение</button>
      <QueryProvider key={scope} connectionScope={scope}>
        <ConversationSelectionProvider>
          <SelectionControls withComposer={withComposer} />
        </ConversationSelectionProvider>
      </QueryProvider>
    </>
  )
}
const historyResponse = (scope: string, chatId: string) =>
  Response.json({ status: 'ok', connectionScope: scope, chatId, messages: [] })
const installHistory = () => {
  const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
    const scope = new Headers(init?.headers).get('X-Connection-Scope') ?? scopeA
    const { chatId } = JSON.parse(String(init?.body)) as { chatId: string }
    return historyResponse(scope, chatId)
  })
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

afterEach(async () => {
  cleanup()
  await Promise.all(sessions().map((session) => session.close()))
})

test('selection Context: StrictMode click is one access, both consumers share A → A → B', async () => {
  const fetcher = installHistory()
  const user = userEvent.setup()
  render(<SelectionHost />, { reactStrictMode: true })
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  expect(
    within(screen.getByRole('region', { name: 'Первый получатель' })).getByText(
      TARGET_A.label,
    ),
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Второй получатель' })).getByText(
      TARGET_A.label,
    ),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  await user.click(screen.getByRole('button', { name: 'Открыть Б' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3))
  expect(screen.getAllByText(TARGET_B.label)).toHaveLength(2)
  expect(
    fetcher.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).chatId),
  ).toEqual([chatA, chatA, chatB])
})

test('selection Context: close preserves Query data, closed session hides and guards selection', async () => {
  installHistory()
  const user = userEvent.setup()
  render(<SelectionHost />)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await user.click(screen.getByRole('button', { name: 'Запомнить' }))
  await user.click(screen.getByRole('button', { name: 'Назад' }))
  await user.click(screen.getByRole('button', { name: 'Закрыть' }))
  expect(
    screen.getByText('Сохранённые данные: Известное сообщение'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Завершить сеанс' }))
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  expect(screen.getAllByText('Не выбрана')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: 'Сменить подключение' }))
  expect(screen.getByText('Сохранённые данные: нет')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  expect(screen.getAllByText(TARGET_A.label)).toHaveLength(2)
})

test('selection slots: pending/empty/error differ, access and editor epoch are independent', async () => {
  installHistory()
  const user = userEvent.setup()
  render(<SelectionHost withComposer />)
  const retry = vi.fn(async () => undefined)
  const stateView = render(<ChatHistoryState kind="loading" onRetry={retry} />)
  expect(screen.getByText('Загрузка истории…')).toBeInTheDocument()
  stateView.rerender(<ChatHistoryState kind="empty" onRetry={retry} />)
  expect(screen.getByText('Переписка ещё не начата')).toBeInTheDocument()
  stateView.rerender(<ChatHistoryState kind="error" onRetry={retry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Не удалось загрузить историю',
  )
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  const editor = screen.getByRole('textbox', { name: 'Сообщение' })
  await user.type(editor, draftA)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  expect(editor).toHaveValue(draftA)
  await user.click(screen.getByRole('button', { name: 'Назад' }))
  expect(editor).toHaveValue(draftA)
  await user.click(screen.getByRole('button', { name: 'Открыть Б' }))
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
  await user.type(screen.getByRole('textbox', { name: 'Сообщение' }), draftB)
  await user.click(screen.getByRole('button', { name: 'Закрыть' }))
  expect(
    screen.queryByRole('textbox', { name: 'Сообщение' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
  expect(sendBoundary.send).not.toHaveBeenCalled()
})
