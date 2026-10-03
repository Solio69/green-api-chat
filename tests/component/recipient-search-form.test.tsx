import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { RecipientSearchForm } from '@/features/recipients/ui'
import { RECIPIENT_CONTRACT, RECIPIENT_SCENARIOS } from '../constants'

const selection = vi.hoisted(() => ({ openConversation: vi.fn() }))
const owner = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/components/QueryProvider', () => ({
  useOptionalQuerySession: () => owner.current,
}))
beforeEach(() => {
  owner.current = null
})

vi.mock('@/features/conversation/ui/ConversationSelectionProvider', () => ({
  useConversationSelection: () => selection,
}))

const {
  PHONE_LABEL,
  USERNAME_MODE,
  USERNAME_LABEL,
  SUBMIT,
  WRITE,
  PHONE_REQUIRED,
  RATE_LIMITED,
} = RECIPIENT_CONTRACT
const { foundPhone, foundUsername, chatId } = RECIPIENT_SCENARIOS

test('recipient search: unmount aborts the pending request', async () => {
  const user = userEvent.setup()
  let signal: AbortSignal | null | undefined
  const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    signal = init?.signal
    return new Promise<Response>(() => undefined)
  })
  vi.stubGlobal('fetch', fetcher)
  const view = render(<RecipientSearchForm />)

  await user.type(screen.getByLabelText(PHONE_LABEL), foundPhone)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  expect(fetcher).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(signal?.aborted).toBe(true)
})

test('recipient search: phone result opens only the selected chat with normalized label', async () => {
  const user = userEvent.setup()
  const fetcher = vi.fn(async () =>
    Response.json({ status: 'ok', result: 'found', chatId }),
  )
  vi.stubGlobal('fetch', fetcher)
  render(<RecipientSearchForm />)

  await user.type(screen.getByLabelText(PHONE_LABEL), foundPhone)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  expect(await screen.findByText(foundPhone, { exact: true })).toBeVisible()
  expect(selection.openConversation).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: WRITE }))
  expect(selection.openConversation).toHaveBeenCalledWith({
    chatId,
    label: foundPhone,
  })
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('recipient search: validation, pending guard, server error and username retry remain local', async () => {
  const user = userEvent.setup()
  let finishRequest: (response: Response) => void = () => undefined
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finishRequest = resolve
      }),
  )
  vi.stubGlobal('fetch', fetcher)
  const view = render(<RecipientSearchForm />)
  const phone = screen.getByLabelText(PHONE_LABEL)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  expect(phone).toHaveFocus()
  expect(screen.getByText(PHONE_REQUIRED)).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()

  await user.type(phone, foundPhone)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  const form = view.container.querySelector('form')
  if (!form) throw new Error('Missing recipient form')
  fireEvent.submit(form)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: USERNAME_MODE })).toBeDisabled()
  await act(async () => {
    finishRequest(
      Response.json({ status: 'error', code: 'rate_limited' }, { status: 429 }),
    )
  })
  expect(screen.getByText(RATE_LIMITED)).toBeVisible()
  await user.click(screen.getByRole('button', { name: USERNAME_MODE }))
  expect(screen.queryByText(RATE_LIMITED)).toBeNull()
  await user.type(screen.getByLabelText(USERNAME_LABEL), foundUsername)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  await act(async () => {
    finishRequest(Response.json({ status: 'ok', result: 'found', chatId }))
  })
  await waitFor(() =>
    expect(
      screen.getByText(`@${foundUsername}`, { exact: true }),
    ).toBeVisible(),
  )
  await user.click(screen.getByRole('button', { name: WRITE }))
  expect(selection.openConversation).toHaveBeenCalledWith({
    chatId,
    label: `@${foundUsername}`,
  })
})

test('recipient search: closing the connection aborts its pending request', async () => {
  const user = userEvent.setup()
  let cleanup: () => void = () => undefined
  owner.current = {
    isActive: () => true,
    registerCleanup: (callback: () => void) => {
      cleanup = callback
      return () => undefined
    },
  }
  let signal: AbortSignal | null | undefined
  const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    signal = init?.signal
    return new Promise<Response>(() => undefined)
  })
  vi.stubGlobal('fetch', fetcher)
  render(<RecipientSearchForm />)

  await user.type(screen.getByLabelText(PHONE_LABEL), foundPhone)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  expect(fetcher).toHaveBeenCalledTimes(1)
  cleanup()
  expect(signal?.aborted).toBe(true)
})
