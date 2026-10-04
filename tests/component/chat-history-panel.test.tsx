import { act, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ChatHistoryPanel } from '@/features/conversation/ui/ChatHistoryPanel'

const mocks = vi.hoisted(() => ({
  history: vi.fn(),
  messages: vi.fn(),
  issues: vi.fn(),
  selection: vi.fn(),
  owner: vi.fn(),
}))

vi.mock('@/features/conversation/history/ui/use-chat-history', () => ({
  useChatHistory: mocks.history,
}))
vi.mock(
  '@/features/conversation/messages/ui/use-conversation-messages',
  () => ({
    useConversationMessages: mocks.messages,
  }),
)
vi.mock('@/features/conversation/messages/ui/use-message-issues', () => ({
  useMessageIssues: mocks.issues,
}))
vi.mock('@/features/conversation/ui/ConversationSelectionProvider', () => ({
  useConversationSelection: mocks.selection,
}))
vi.mock('@/features/conversation/ui/NotificationProvider', () => ({
  useOptionalNotificationOwner: mocks.owner,
}))
vi.mock('@/features/conversation/ui/ChatHistoryState', () => ({
  ChatHistoryState: ({ kind }: { kind: string }) => <p>{kind}</p>,
}))
vi.mock('@/features/conversation/ui/MessageList', () => ({
  MessageList: ({ messages }: { messages: unknown[] }) => (
    <p>Сообщений: {messages.length}</p>
  ),
}))
vi.mock('@/features/conversation/ui/MessageStatusIssue', () => ({
  MessageStatusIssue: () => null,
}))

const setup = ({
  data,
  isPending = false,
  isFetching = false,
  error = null,
  chatId = '111@c.us',
}: {
  data?: unknown[]
  isPending?: boolean
  isFetching?: boolean
  error?: Error | null
  chatId?: string | null
}) => {
  const refetch = vi.fn(async () => undefined)
  let recover: (() => void) | undefined
  const unsubscribe = vi.fn()
  const subscribeRecovery = vi.fn((listener: () => void) => {
    recover = listener
    return unsubscribe
  })
  mocks.history.mockReturnValue({ isPending, isFetching, error, refetch })
  mocks.messages.mockReturnValue({ data })
  mocks.issues.mockReturnValue({ chat: null })
  mocks.selection.mockReturnValue({
    target: chatId === null ? null : { chatId, label: chatId },
  })
  mocks.owner.mockReturnValue({ subscribeRecovery })
  const view = render(<ChatHistoryPanel />)
  return {
    ...view,
    refetch,
    subscribeRecovery,
    unsubscribe,
    recover: () => recover?.(),
  }
}

test('history panel keeps loading, empty and error states while preserving known messages', () => {
  const loading = setup({ isPending: true })
  expect(screen.getByText('loading')).toBeInTheDocument()
  loading.unmount()

  const empty = setup({ data: [] })
  expect(screen.getByText('empty')).toBeInTheDocument()
  empty.unmount()

  const failed = setup({ data: [{}], error: new Error('offline') })
  expect(screen.getByText('error')).toBeInTheDocument()
  expect(screen.getByText('Сообщений: 1')).toBeInTheDocument()
  failed.unmount()
})

test('history panel subscribes to recovery and refetches only a selected chat', () => {
  const selected = setup({ data: [] })
  expect(selected.subscribeRecovery).toHaveBeenCalledTimes(1)
  act(() => selected.recover())
  expect(selected.refetch).toHaveBeenCalledTimes(1)
  selected.unmount()
  expect(selected.unsubscribe).toHaveBeenCalledTimes(1)

  const noSelection = setup({ data: [], chatId: null })
  act(() => noSelection.recover())
  expect(noSelection.refetch).not.toHaveBeenCalled()
  expect(screen.queryByText('empty')).not.toBeInTheDocument()
  noSelection.unmount()
})
