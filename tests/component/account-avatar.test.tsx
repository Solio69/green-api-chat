import { fireEvent, render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AccountAvatar } from '@/features/account/ui'
import { ACCOUNT_CONTRACT } from '../constants'

const { PROFILE, REFERRER_POLICY } = ACCOUNT_CONTRACT

test('account avatar: a failed image falls back to an icon and a new URL can load', () => {
  const view = render(<AccountAvatar avatarUrl={PROFILE.avatarUrl} />)
  const image = view.container.querySelector('img')
  if (!image) throw new Error('Expected avatar image')
  expect(image).toHaveAttribute('src', PROFILE.avatarUrl)
  expect(image).toHaveAttribute('alt', '')
  expect(image).toHaveAttribute('referrerpolicy', REFERRER_POLICY)

  fireEvent.error(image)
  expect(view.container.querySelector('img')).toBeNull()
  expect(view.container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()

  const nextUrl = 'https://avatars.example.test/new.png'
  view.rerender(<AccountAvatar avatarUrl={nextUrl} />)
  expect(view.container.querySelector('img')).toHaveAttribute('src', nextUrl)
})

test('account avatar: missing image is decorative fallback', () => {
  const view = render(<AccountAvatar avatarUrl="" />)
  expect(view.container.querySelector('img')).toBeNull()
  expect(view.container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
})
