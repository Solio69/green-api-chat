import { expect, test } from '@playwright/test'
import { createSseParser } from '@/lib/notifications/parse-sse'

const CLIENT_TEST = {
  EVENT: 'notification',
  TEXT: 'Привет 🙂',
  MAX_FRAME: 131_072,
} as const
const { EVENT, TEXT, MAX_FRAME } = CLIENT_TEST
test('SSE parser handles split UTF8 and CRLF with multiple data lines', () => {
  const bytes = new TextEncoder().encode(
    `event: ${EVENT}\r\ndata: ${TEXT}\r\ndata: second\r\n\r\n`,
  )
  const parser = createSseParser()
  const frames = [...bytes].flatMap((byte) => parser.push(Uint8Array.of(byte)))
  expect(frames).toEqual([{ event: EVENT, data: `${TEXT}\nsecond` }])
})
test('SSE parser rejects oversized frames and invalid UTF8', () => {
  expect(() =>
    createSseParser().push(new TextEncoder().encode('x'.repeat(MAX_FRAME + 1))),
  ).toThrow()
  expect(() => createSseParser().push(Uint8Array.of(255))).toThrow()
})
