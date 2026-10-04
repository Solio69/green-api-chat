import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import { useChatHistory } from '@/features/conversation/history/ui/use-chat-history'
import type { MessageDTO } from '@/features/conversation/messages/model/types'
import {
  ConversationSelectionProvider,
  useConversationSelection,
} from '@/features/conversation/ui/ConversationSelectionProvider'
import { QueryProvider } from '@/features/conversation/ui/QueryProvider'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { HISTORY_TEST } from '../history/constants'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock('@/features/conversation/application/create-connection-session', {
  spy: true,
})

const {
  scopeA,
  scopeB,
  chatA,
  chatB,
  TARGET_A,
  TARGET_B,
  message,
  CURRENT_MESSAGE_ID,
} = HISTORY_TEST
const sessions = () =>
  vi
    .mocked(createConnectionSession)
    .mock.results.filter((result) => result.type === 'return')
    .map((result) => result.value)
const historyResponse = ({
  chatId,
  scope = scopeA,
  messages = [message],
}: {
  chatId: string
  scope?: string
  messages?: MessageDTO[]
}) => Response.json({ status: 'ok', connectionScope: scope, chatId, messages })

const HistoryConsumer = ({
  name,
  canRefresh = false,
}: {
  name: string
  canRefresh?: boolean
}) => {
  const { target } = useConversationSelection()
  const { data, isPending, error, refetch } = useChatHistory(
    target?.chatId ?? null,
  )
  return (
    <section aria-label={name}>
      {canRefresh && <button onClick={() => void refetch()}>Обновить</button>}
      {isPending && <p>Загружаем историю</p>}
      {error && <p role="alert">{error.code}</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((item) => (
            <li key={item.idMessage}>{item.text}</li>
          ))}
        </ul>
      )}
      {data?.length === 0 && <p>История пуста</p>}
    </section>
  )
}

const Controls = () => {
  const selection = useConversationSelection()
  const session = useOptionalQuerySession()
  const [showFirst, setShowFirst] = useState(true)
  return (
    <>
      <button onClick={() => selection.openConversation(TARGET_A)}>
        Открыть А
      </button>
      <button onClick={() => selection.openConversation(TARGET_B)}>
        Открыть Б
      </button>
      <button onClick={selection.closeConversation}>Закрыть</button>
      <button onClick={() => void session?.close()}>Завершить сеанс</button>
      <button onClick={() => setShowFirst(false)}>Скрыть первого</button>
      {showFirst && <HistoryConsumer name="Первая история" canRefresh />}
      <HistoryConsumer name="Вторая история" />
    </>
  )
}

const HistoryHost = () => {
  const [scope, setScope] = useState<string>(scopeA)
  return (
    <>
      <button onClick={() => setScope(scopeB)}>Сменить подключение</button>
      <QueryProvider key={scope} connectionScope={scope}>
        <ConversationSelectionProvider>
          <Controls />
        </ConversationSelectionProvider>
      </QueryProvider>
    </>
  )
}

afterEach(async () => {
  cleanup()
  await Promise.all(sessions().map((session) => session.close()))
})

test('history React: shared request applies once across consumers', async () => {
  const pending = Promise.withResolvers<Response>()
  const fetcher = vi.fn(() => pending.promise)
  vi.stubGlobal('fetch', fetcher)
  const user = userEvent.setup()
  render(<HistoryHost />)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  await act(async () => pending.resolve(historyResponse({ chatId: chatA })))
  expect(
    await within(
      screen.getByRole('region', { name: 'Первая история' }),
    ).findByText(/Фиктивное сообщение/),
  ).toBeInTheDocument()
  expect(
    await within(
      screen.getByRole('region', { name: 'Вторая история' }),
    ).findByText(/Фиктивное сообщение/),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Скрыть первого' }))
  expect(
    screen.queryByRole('region', { name: 'Первая история' }),
  ).not.toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Вторая история' })).getByText(
      /Фиктивное сообщение/,
    ),
  ).toBeInTheDocument()
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('history React: A to B to A discards the earlier completion', async () => {
  const requests: Array<ReturnType<typeof Promise.withResolvers<Response>>> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      const pending = Promise.withResolvers<Response>()
      requests.push(pending)
      return pending.promise
    }),
  )
  const user = userEvent.setup()
  render(<HistoryHost />)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(requests).toHaveLength(1))
  await user.click(screen.getByRole('button', { name: 'Открыть Б' }))
  await waitFor(() => expect(requests).toHaveLength(2))
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(requests).toHaveLength(3))
  const current: MessageDTO = {
    ...message,
    idMessage: CURRENT_MESSAGE_ID,
    text: 'Текущее сообщение',
    timestamp: 300,
  }
  await act(async () =>
    requests[2].resolve(
      historyResponse({ chatId: chatA, messages: [current] }),
    ),
  )
  await act(async () => {
    requests[0].resolve(historyResponse({ chatId: chatA }))
    requests[1].resolve(historyResponse({ chatId: chatB, messages: [] }))
  })
  await waitFor(() =>
    expect(screen.getAllByText('Текущее сообщение')).toHaveLength(2),
  )
  expect(screen.queryByText(/Фиктивное сообщение/)).not.toBeInTheDocument()
})

test('history React: pending refresh is deduplicated, close suppresses its late result', async () => {
  const pending = Promise.withResolvers<Response>()
  const fetcher = vi.fn(() => pending.promise)
  vi.stubGlobal('fetch', fetcher)
  const user = userEvent.setup()
  render(<HistoryHost />)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  expect(screen.getAllByText('Загружаем историю')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: 'Обновить' }))
  expect(fetcher).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Закрыть' }))
  await act(async () => pending.resolve(historyResponse({ chatId: chatA })))
  expect(screen.queryByText(/Фиктивное сообщение/)).not.toBeInTheDocument()
})

test('history React: closed session rejects late data and new connection has independent history', async () => {
  const requests: Array<ReturnType<typeof Promise.withResolvers<Response>>> = []
  const fetcher = vi.fn<typeof fetch>(() => {
    const pending = Promise.withResolvers<Response>()
    requests.push(pending)
    return pending.promise
  })
  vi.stubGlobal('fetch', fetcher)
  const user = userEvent.setup()
  render(<HistoryHost />)
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(requests).toHaveLength(1))
  await user.click(screen.getByRole('button', { name: 'Завершить сеанс' }))
  await act(async () => requests[0].resolve(historyResponse({ chatId: chatA })))
  expect(screen.queryByText(/Фиктивное сообщение/)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Сменить подключение' }))
  await user.click(screen.getByRole('button', { name: 'Открыть А' }))
  await waitFor(() => expect(requests).toHaveLength(2))
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    headers: { 'X-Connection-Scope': scopeB },
  })
  await act(async () =>
    requests[1].resolve(
      historyResponse({ chatId: chatA, scope: scopeB, messages: [] }),
    ),
  )
  await waitFor(() =>
    expect(screen.getAllByText('История пуста')).toHaveLength(2),
  )
})
