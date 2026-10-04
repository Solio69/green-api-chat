import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { createNotificationConnection } from '@/features/conversation/notifications/application/create-notification-connection'
import type { ConnectionState } from '@/features/conversation/notifications/model/connection-model'
import { NotificationNotice } from '@/features/conversation/ui/NotificationNotice'
import { NotificationContext } from '@/features/conversation/ui/NotificationProvider/context'

vi.mock('@/features/conversation/messages/ui/use-message-issues', () => ({
  useMessageIssues: () => ({ connection: null }),
}))

type Controller = ReturnType<typeof createNotificationConnection>
const renderNotice = () => {
  let snapshot: ConnectionState = {
    status: 'connected',
    canSend: true,
    issue: null,
  }
  const listeners = new Set<() => void>()
  const retry = vi.fn(async () => undefined)
  const store = {
    retry,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => snapshot,
  } satisfies Pick<Controller, 'retry' | 'subscribe' | 'getSnapshot'>
  render(
    <NotificationContext.Provider value={store as unknown as Controller}>
      <NotificationNotice />
    </NotificationContext.Provider>,
  )
  return {
    retry,
    publish: (next: ConnectionState) =>
      act(() => {
        snapshot = next
        listeners.forEach((listener) => listener())
      }),
  }
}

test('notification notice keeps limited and paused alerts with manual retry', async () => {
  const user = userEvent.setup()
  const view = renderNotice()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  view.publish({ status: 'limited', canSend: false, issue: 'ownership_busy' })
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Рабочий чат уже открыт в другой вкладке.',
  )
  await user.click(screen.getByRole('button', { name: 'Подключиться снова' }))
  expect(view.retry).toHaveBeenCalledTimes(1)
  view.publish({
    status: 'paused',
    canSend: false,
    issue: 'invalid_upstream_response',
  })
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Получено некорректное уведомление.',
  )
})

test('notification notice keeps reconnecting and outgoing-settings status text', () => {
  const view = renderNotice()
  view.publish({ status: 'retrying', canSend: false, issue: 'retry_later' })
  expect(screen.getByRole('status')).toHaveTextContent(
    'Соединение восстанавливается. Отправка временно недоступна.',
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  view.publish({
    status: 'connected',
    canSend: true,
    issue: 'outgoing_notifications_disabled',
  })
  expect(screen.getByRole('status')).toHaveTextContent(
    'Статусы отправки могут не поступать.',
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
