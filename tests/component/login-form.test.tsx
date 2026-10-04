import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LoginForm } from '@/features/auth/ui'
import { CREDENTIALS, LOGIN_CONTRACT } from '../constants'

const navigation = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}))

const { ID, TOKEN } = CREDENTIALS
const { ID_LABEL, TOKEN_LABEL, SUBMIT, ID_ERROR, INVALID_TOKEN } =
  LOGIN_CONTRACT

test('login: a late successful response after unmount cannot navigate a new form', async () => {
  const user = userEvent.setup()
  let finishRequest: (response: Response) => void = () => undefined
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finishRequest = resolve
      }),
  )
  vi.stubGlobal('fetch', fetcher)
  const view = render(<LoginForm />)

  await user.type(screen.getByLabelText(ID_LABEL), ID)
  await user.type(screen.getByLabelText(TOKEN_LABEL), TOKEN)
  await user.click(screen.getByRole('button', { name: SUBMIT }))
  expect(fetcher).toHaveBeenCalledTimes(1)

  view.unmount()
  await act(async () => {
    finishRequest(Response.json({ status: 'ok' }))
  })
  expect(navigation.replace).not.toHaveBeenCalled()
})

test('login: validation focuses missing fields and one pending request blocks duplicate submit', async () => {
  const user = userEvent.setup()
  let finishRequest: (response: Response) => void = () => undefined
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finishRequest = resolve
      }),
  )
  vi.stubGlobal('fetch', fetcher)
  const view = render(<LoginForm />)
  const id = screen.getByLabelText(ID_LABEL)
  const token = screen.getByLabelText(TOKEN_LABEL)
  const submit = screen.getByRole('button', { name: SUBMIT })

  await user.click(submit)
  expect(id).toHaveFocus()
  expect(screen.getByText(ID_ERROR)).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()

  await user.type(id, ID)
  await user.click(submit)
  expect(token).toHaveFocus()
  expect(fetcher).not.toHaveBeenCalled()

  await user.type(token, TOKEN)
  await user.click(submit)
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(submit).toBeDisabled()
  const formElement = view.container.querySelector('form')
  if (!formElement) throw new Error('Missing login form')
  fireEvent.submit(formElement)
  expect(fetcher).toHaveBeenCalledTimes(1)
  await act(async () => {
    finishRequest(
      Response.json(
        { status: 'error', code: 'invalid_token' },
        { status: 401 },
      ),
    )
  })
  expect(screen.getByText(INVALID_TOKEN)).toBeVisible()
  expect(token).toHaveAttribute('aria-invalid', 'true')
  await user.type(token, ' correction')
  await waitFor(() => expect(screen.queryByText(INVALID_TOKEN)).toBeNull())
  expect(submit).toBeEnabled()
})
