import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import {
  MESSAGING_UI_TEST,
  NOTIFICATION_NOTICE_TEST,
} from '../notifications/ui-constants'
import type { MessageIssue } from '@/features/conversation/messages/model/types'
import type { createNotificationConnection } from '@/features/conversation/notifications/application/create-notification-connection'
import type { ConnectionState } from '@/features/conversation/notifications/model/connection-model'
import { NotificationNotice } from '@/features/conversation/ui/NotificationNotice'
import { NotificationContext } from '@/features/conversation/ui/NotificationProvider/context'
import { NOTIFICATION_CONNECTION_TEST } from '../notifications/constants'
import { TEST_MESSAGE_PROTOCOL } from '../protocol.constants'
import { TEST_UI } from '../shared.constants'

const {
  CONNECTED,
  RETRYING,
  LIMITED,
  PAUSED,
  OWNERSHIP_BUSY,
  LOCK_UNAVAILABLE: LOCK_UNAVAILABLE_ISSUE,
  INVALID_UPSTREAM: INVALID_UPSTREAM_ISSUE,
  NOT_CONFIGURED,
  OUTGOING_DISABLED: OUTGOING_DISABLED_ISSUE,
  RETRY_LATER,
} = NOTIFICATION_CONNECTION_TEST
const {
  OWNERSHIP_BUSY: OWNERSHIP_BUSY_COPY,
  LOCK_UNAVAILABLE: LOCK_UNAVAILABLE_COPY,
  INVALID_UPSTREAM: INVALID_UPSTREAM_COPY,
  PAUSED: PAUSED_COPY,
  RETRY: RETRY_COPY,
  OUTGOING_DISABLED: OUTGOING_DISABLED_COPY,
  RECONNECTING: RECONNECTING_COPY,
} = NOTIFICATION_NOTICE_TEST
const { FAILED: FAILED_MESSAGE_COPY } = MESSAGING_UI_TEST
const { FAILED: FAILED_MESSAGE_CODE } = TEST_MESSAGE_PROTOCOL
const { ROLE_ALERT, ROLE_BUTTON, ROLE_STATUS } = TEST_UI

const messageIssues = vi.hoisted<{ connection: MessageIssue | null }>(() => ({
  connection: null,
}))
vi.mock('@/features/conversation/messages/ui/use-message-issues', () => ({
  useMessageIssues: () => messageIssues,
}))

type Controller = ReturnType<typeof createNotificationConnection>
const renderNotice = () => {
  messageIssues.connection = null
  let snapshot: ConnectionState = {
    status: CONNECTED,
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
    publishMessageIssue: (issue: MessageIssue) =>
      act(() => {
        messageIssues.connection = issue
        snapshot = { ...snapshot }
        listeners.forEach((listener) => listener())
      }),
  }
}

test('notification notice keeps limited and paused alerts with manual retry', async () => {
  const user = userEvent.setup()
  const view = renderNotice()
  expect(screen.queryByRole(ROLE_ALERT)).not.toBeInTheDocument()
  view.publish({ status: LIMITED, canSend: false, issue: OWNERSHIP_BUSY })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(OWNERSHIP_BUSY_COPY)
  view.publish({
    status: LIMITED,
    canSend: false,
    issue: LOCK_UNAVAILABLE_ISSUE,
  })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(LOCK_UNAVAILABLE_COPY)
  await user.click(screen.getByRole(ROLE_BUTTON, { name: RETRY_COPY }))
  expect(view.retry).toHaveBeenCalledTimes(1)
  view.publish({
    status: PAUSED,
    canSend: false,
    issue: INVALID_UPSTREAM_ISSUE,
  })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(INVALID_UPSTREAM_COPY)
  view.publish({
    status: PAUSED,
    canSend: false,
    issue: NOT_CONFIGURED,
  })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(PAUSED_COPY)
})

test('notification notice stays absent during repeated temporary failures', () => {
  const view = renderNotice()
  for (let attempt = 0; attempt < 2; attempt += 1) {
    view.publish({ status: RETRYING, canSend: true, issue: RETRY_LATER })
    expect(screen.queryByRole(ROLE_STATUS)).not.toBeInTheDocument()
    expect(screen.queryByText(RECONNECTING_COPY)).not.toBeInTheDocument()
    view.publish({ status: CONNECTED, canSend: true, issue: null })
    expect(screen.queryByRole(ROLE_STATUS)).not.toBeInTheDocument()
  }
  view.publish({ status: RETRYING, canSend: false, issue: RETRY_LATER })
  expect(screen.queryByRole(ROLE_STATUS)).not.toBeInTheDocument()
  expect(screen.queryByRole(ROLE_BUTTON)).not.toBeInTheDocument()
})

test('notification notice preserves outgoing-settings and message-status warnings', () => {
  const view = renderNotice()
  view.publish({
    status: CONNECTED,
    canSend: true,
    issue: OUTGOING_DISABLED_ISSUE,
  })
  expect(screen.getByRole(ROLE_STATUS)).toHaveTextContent(
    OUTGOING_DISABLED_COPY,
  )
  view.publishMessageIssue({
    chatId: null,
    idMessage: null,
    code: FAILED_MESSAGE_CODE,
  })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(FAILED_MESSAGE_COPY)
  view.publish({ status: RETRYING, canSend: true, issue: RETRY_LATER })
  expect(screen.getByRole(ROLE_ALERT)).toHaveTextContent(FAILED_MESSAGE_COPY)
  expect(screen.queryByRole(ROLE_STATUS)).not.toBeInTheDocument()
  expect(screen.queryByRole(ROLE_BUTTON)).not.toBeInTheDocument()
})
