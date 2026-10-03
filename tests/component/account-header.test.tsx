import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { AccountHeader } from '@/features/account/ui'
import { ACCOUNT_CONTRACT } from '../constants'

vi.mock('@/features/auth/ui', () => ({
  LogoutButton: ({ label }: { label: string }) => <button>{label}</button>,
}))

const { REGION, DEFAULT_LABEL, CONNECTED, PROFILE } = ACCOUNT_CONTRACT

test('account header: uses the accessible account region and a fallback label', () => {
  render(
    <AccountHeader
      account={{ label: '', avatarUrl: '' }}
      logoutLabel="Выйти"
    />,
  )

  const region = screen.getByRole('region', { name: REGION })
  expect(region).toHaveTextContent(DEFAULT_LABEL)
  expect(region).toHaveTextContent(CONNECTED)
  expect(screen.getByRole('button', { name: 'Выйти' })).toBeVisible()
  expect(region.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})

test('account header: displays the normalized label without credentials', () => {
  render(<AccountHeader account={PROFILE} logoutLabel="Выйти" />)
  expect(screen.getByRole('region', { name: REGION })).toHaveTextContent(
    PROFILE.label,
  )
})
