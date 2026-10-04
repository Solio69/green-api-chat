import { expect, test } from 'vitest'
import { normalizeAccountProfile } from '@/features/account/model'
import { ACCOUNT_CONTRACT, CREDENTIALS } from '../constants'

const { ID, TOKEN } = CREDENTIALS
const { PROFILE } = ACCOUNT_CONTRACT
const credentials = { idInstance: ID, apiTokenInstance: TOKEN.trim() }

test('account model: only safe display fields survive a partial provider response', () => {
  const profile = normalizeAccountProfile({
    value: {
      username: 17,
      phone: ' 12025550123 ',
      avatar: 'http://avatars.example.test/account.png',
      apiTokenInstance: TOKEN,
    },
    credentials,
  })

  expect(profile).toEqual({ label: '12025550123', avatarUrl: '' })
  expect(profile).not.toHaveProperty('apiTokenInstance')
})

test('account model: credential-bearing username falls back to safe phone', () => {
  const profile = normalizeAccountProfile({
    value: {
      username: `@${TOKEN.trim()}`,
      phone: PROFILE.label,
      avatar: PROFILE.avatarUrl,
    },
    credentials,
  })

  expect(profile).toEqual(PROFILE)
})
