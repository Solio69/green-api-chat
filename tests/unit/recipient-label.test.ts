import { expect, test } from 'vitest'
import {
  parseSearchRequest,
  formatRecipientLabel,
} from '@/features/recipients/model'

test('recipient label: displays the normalized submitted username', () => {
  const query = parseSearchRequest({ mode: 'username', value: 'demo_user' })
  if (!query) throw new Error('Valid query expected')
  expect(formatRecipientLabel(query)).toBe('@demo_user')
  expect(query).toEqual({ username: '@demo_user' })
})

test('recipient label: displays the submitted phone without a Telegram suffix', () => {
  const query = parseSearchRequest({ mode: 'phone', value: '12025550123' })
  if (!query) throw new Error('Valid query expected')
  expect(formatRecipientLabel(query)).toBe('12025550123')
  expect(query).toEqual({ phoneNumber: 12025550123 })
})
