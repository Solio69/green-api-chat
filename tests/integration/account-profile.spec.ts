import { expect, test } from '@playwright/test'
import { normalizeAccountProfile } from '@/features/account/model'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { ACCOUNT_CONTRACT, ACCOUNT_SCENARIOS, CREDENTIALS } from '../constants'

const INVALID_AVATAR_URL = 'http://avatars.example.test/a.png'
const INVALID_AVATAR_URL_2 = 'https://user:password@avatars.example.test/a.png'

const { ID, TOKEN } = CREDENTIALS
const { PROFILE } = ACCOUNT_CONTRACT
const PHONE = ACCOUNT_SCENARIOS.phone.phone
const PADDED_PHONE = ` ${PHONE} `
const PERCENT_ENCODED_ID = '%30%30%30%30%31%32%33%34%35%36%37%38%39'
const credentials = { idInstance: ID, apiTokenInstance: TOKEN.trim() }

test('account-profile: whitelists display fields and trims username before phone', () =>
  expect(
    normalizeAccountProfile({
      value: {
        username: `  ${PROFILE.label}  `,
        phone: PADDED_PHONE,
        avatar: PROFILE.avatarUrl,
        apiTokenInstance: TOKEN,
        chatId: ID,
      },
      credentials,
    }),
  ).toEqual(PROFILE))

test('account-profile: uses phone when username is absent or invalid', () => {
  for (const username of [undefined, null, 42, EMPTY_STRING, '   ']) {
    expect(
      normalizeAccountProfile({
        value: { username, phone: PADDED_PHONE },
        credentials,
      }),
    ).toEqual({ label: PHONE, avatarUrl: EMPTY_STRING })
  }
})

test('account-profile: missing and mistyped optional fields remain empty', () => {
  for (const value of [
    null,
    [],
    EMPTY_STRING,
    42,
    {},
    { username: false, phone: [], avatar: {} },
  ]) {
    expect(normalizeAccountProfile({ value, credentials })).toEqual({
      label: EMPTY_STRING,
      avatarUrl: EMPTY_STRING,
    })
  }
})

test('account-profile: accepts an absolute HTTPS avatar and trims it', () =>
  expect(
    normalizeAccountProfile({
      value: { avatar: ` ${PROFILE.avatarUrl} ` },
      credentials,
    }).avatarUrl,
  ).toBe(PROFILE.avatarUrl))

test('account-profile: rejects unsafe, relative and malformed avatar URLs', () => {
  for (const avatar of [
    '/account.png',
    'not a URL',
    INVALID_AVATAR_URL,
    'javascript:alert(1)',
    'data:image/png;base64,AA==',
    INVALID_AVATAR_URL_2,
  ]) {
    expect(
      normalizeAccountProfile({ value: { avatar }, credentials }).avatarUrl,
    ).toBe(EMPTY_STRING)
  }
})

test('account-profile: suppresses raw and encoded credentials in every display field', () => {
  for (const secret of [
    ID,
    TOKEN.trim(),
    encodeURIComponent(TOKEN.trim()),
    PERCENT_ENCODED_ID,
  ]) {
    const profile = normalizeAccountProfile({
      value: {
        username: `@${secret}`,
        phone: secret,
        avatar: `https://avatars.example.test/${secret}`,
      },
      credentials,
    })
    expect(profile).toEqual({ label: EMPTY_STRING, avatarUrl: EMPTY_STRING })
  }
})

test('account-profile: safe phone remains usable when username contains a credential', () =>
  expect(
    normalizeAccountProfile({
      value: { username: TOKEN, phone: PHONE },
      credentials,
    }).label,
  ).toBe(PHONE))
