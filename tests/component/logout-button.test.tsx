import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LogoutButton } from '@/features/auth/ui'

const dependencies = vi.hoisted(() => ({
  close: vi.fn(async () => undefined),
  replace: vi.fn(),
  refresh: vi.fn(),
  getOwnedHeaders: vi.fn(() => new Headers({ 'X-Owner': 'fictional-tab' })),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: dependencies.replace,
    refresh: dependencies.refresh,
  }),
}))
vi.mock('@/features/conversation/ui/NotificationProvider', () => ({
  useOptionalNotificationOwner: () => ({
    getOwnedHeaders: dependencies.getOwnedHeaders,
  }),
}))
vi.mock('@/components/QueryProvider', () => ({
  useOptionalQuerySession: () => ({ close: dependencies.close }),
}))

test('logout: failure allows retry; success closes memory and navigates', async () => {
  const user = userEvent.setup()
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetcher)
  render(<LogoutButton label="Выйти" />)
  const button = screen.getByRole('button', { name: 'Выйти' })

  await user.click(button)
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(dependencies.close).not.toHaveBeenCalled()
  await user.click(button)
  await waitFor(() => expect(dependencies.close).toHaveBeenCalledTimes(1))
  expect(screen.queryByRole('alert')).toBeNull()
  expect(dependencies.replace).toHaveBeenCalledWith('/login')
  expect(dependencies.refresh).toHaveBeenCalledTimes(1)
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(fetcher).toHaveBeenCalledWith('/api/auth/logout', {
    method: 'POST',
    headers: dependencies.getOwnedHeaders.mock.results[0].value,
    cache: 'no-store',
  })
})
