import { createHmac, timingSafeEqual } from 'node:crypto'
import type { ReceiverContext } from './types'
import { isRecord } from '@/lib/api/is-record'
import { POLLING_CONFIG } from './constants'

const {
  ACK_PURPOSE,
  SIGNATURE_ALGORITHM,
  TOKEN_ENCODING,
  TOKEN_SEPARATOR,
  ACK_TTL_MS,
  MAX_TOKEN_LENGTH,
} = POLLING_CONFIG
const signature = ({
  payload,
  password,
}: {
  payload: string
  password: string
}) =>
  createHmac(SIGNATURE_ALGORITHM, password)
    .update(ACK_PURPOSE)
    .update(payload)
    .digest()
export const createAckProof = ({
  context,
  receiptId,
  password,
  now = Date.now(),
}: {
  context: ReceiverContext
  receiptId: number
  password: string
  now?: number
}) => {
  const payload = Buffer.from(
    JSON.stringify({
      purpose: ACK_PURPOSE,
      connectionScope: context.connectionScope,
      receiptId,
      expiresAt: Math.min(now + ACK_TTL_MS, context.expiresAt),
    }),
  ).toString(TOKEN_ENCODING)
  return (
    payload +
    TOKEN_SEPARATOR +
    signature({ payload, password }).toString(TOKEN_ENCODING)
  )
}
export const verifyAckProof = ({
  token,
  context,
  password,
  now = Date.now(),
}: {
  token: string
  context: ReceiverContext
  password: string
  now?: number
}): number | null => {
  if (token.length > MAX_TOKEN_LENGTH) return null
  const parts = token.split(TOKEN_SEPARATOR)
  if (parts.length !== 2) return null
  const [payload, provided] = parts
  try {
    const actual = Buffer.from(provided, TOKEN_ENCODING)
    const expected = signature({ payload, password })
    const canonical =
      actual.toString(TOKEN_ENCODING) === provided &&
      actual.length === expected.length
    if (!canonical) return null
    if (!timingSafeEqual(actual, expected)) return null
    const value: unknown = JSON.parse(
      Buffer.from(payload, TOKEN_ENCODING).toString(),
    )
    if (!isRecord(value)) return null
    const valid =
      value.purpose === ACK_PURPOSE &&
      value.connectionScope === context.connectionScope &&
      typeof value.receiptId === 'number' &&
      Number.isSafeInteger(value.receiptId) &&
      value.receiptId > 0 &&
      typeof value.expiresAt === 'number' &&
      Number.isFinite(value.expiresAt) &&
      value.expiresAt > now &&
      value.expiresAt <= context.expiresAt
    return valid ? (value.receiptId as number) : null
  } catch {
    return null
  }
}
