import { describe, expect, it } from 'vitest'
import {
  isSameOrigin,
  readConnectionScope,
  isJsonMediaType,
  readBoundedJsonBody,
  readUnboundedJsonBody,
  jsonNoStore,
} from '@/server/http'

const ORIGIN = 'https://app.example.test'
const SCOPE = 'a'.repeat(43)
const request = ({
  origin = ORIGIN,
  host,
  scope,
  contentType = 'application/json',
  contentLength,
  body = '{}',
}: {
  origin?: string | null
  host?: string
  scope?: string
  contentType?: string | null
  contentLength?: string
  body?: string
} = {}) => {
  const headers = new Headers()
  if (origin !== null) headers.set('Origin', origin)
  if (host !== undefined) headers.set('Host', host)
  if (scope !== undefined) headers.set('X-Connection-Scope', scope)
  if (contentType !== null) headers.set('Content-Type', contentType)
  if (contentLength !== undefined) headers.set('Content-Length', contentLength)
  return new Request(`${ORIGIN}/api/messages`, {
    method: 'POST',
    headers,
    body,
  })
}

describe('shared HTTP guards', () => {
  it('matches strict Origin against actual Host and rejects malformed origins and hosts', () => {
    expect(isSameOrigin(request())).toBe(true)
    expect(isSameOrigin(request({ host: 'app.example.test' }))).toBe(true)
    for (const origin of [
      null,
      'https://foreign.example.test',
      'https://user@app.example.test',
      `${ORIGIN}/path`,
      `${ORIGIN}?query=1`,
      `${ORIGIN}#fragment`,
      'ftp://app.example.test',
    ])
      expect(isSameOrigin(request({ origin }))).toBe(false)
    expect(isSameOrigin(request({ host: 'app.example.test/path' }))).toBe(false)
    expect(isSameOrigin(request({ host: 'different.example.test' }))).toBe(
      false,
    )
  })

  it('reads only syntactically valid scope and JSON media type with parameters', () => {
    expect(readConnectionScope(request({ scope: SCOPE }))).toBe(SCOPE)
    expect(readConnectionScope(request())).toBeNull()
    expect(readConnectionScope(request({ scope: 'invalid' }))).toBeNull()
    expect(
      isJsonMediaType(
        request({ contentType: ' Application/JSON ; charset=utf-8' }),
      ),
    ).toBe(true)
    expect(isJsonMediaType(request({ contentType: 'text/plain' }))).toBe(false)
    expect(isJsonMediaType(request({ contentType: null }))).toBe(false)
  })

  it('counts actual bytes while send ignores a misleading Content-Length', async () => {
    const good = request({ contentLength: '1', body: '{"value":"ё"}' })
    expect(
      await readBoundedJsonBody({
        request: good,
        maxBytes: 20,
        contentLengthPolicy: 'ignore',
      }),
    ).toEqual({ kind: 'ok', value: { value: 'ё' } })
    const tooLarge = request({ contentLength: '1', body: '{"value":"ёёёё"}' })
    expect(
      await readBoundedJsonBody({
        request: tooLarge,
        maxBytes: 15,
        contentLengthPolicy: 'ignore',
      }),
    ).toEqual({ kind: 'too_large' })
  })

  it('cancels an oversized stream and releases its reader', async () => {
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'.repeat(21)))
      },
      cancel() {
        cancelled = true
      },
    })
    const input = request()
    Object.defineProperty(input, 'body', { value: stream })
    expect(
      await readBoundedJsonBody({
        request: input,
        maxBytes: 20,
        contentLengthPolicy: 'ignore',
      }),
    ).toEqual({ kind: 'too_large' })
    expect(cancelled).toBe(true)
    expect(stream.locked).toBe(false)
  })

  it('keeps notification Content-Length policy and rejects malformed UTF-8/JSON', async () => {
    expect(
      await readBoundedJsonBody({
        request: request({ contentLength: 'invalid' }),
        maxBytes: 8_192,
        contentLengthPolicy: 'reject_invalid_or_excess',
      }),
    ).toEqual({ kind: 'invalid_body' })
    expect(
      await readBoundedJsonBody({
        request: request({ contentLength: '8193' }),
        maxBytes: 8_192,
        contentLengthPolicy: 'reject_invalid_or_excess',
      }),
    ).toEqual({ kind: 'invalid_body' })
    const malformed = request()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([0xc3, 0x28]))
        controller.close()
      },
    })
    Object.defineProperty(malformed, 'body', { value: stream })
    expect(
      await readBoundedJsonBody({
        request: malformed,
        maxBytes: 8_192,
        contentLengthPolicy: 'ignore',
      }),
    ).toEqual({ kind: 'invalid_body' })
    expect(stream.locked).toBe(false)
    expect(
      await readBoundedJsonBody({
        request: request({ body: '{' }),
        maxBytes: 8_192,
        contentLengthPolicy: 'ignore',
      }),
    ).toEqual({ kind: 'invalid_body' })
  })

  it('keeps unbounded JSON reading independent of Content-Type', async () => {
    const input = request({
      contentType: 'text/plain',
      body: `${' '.repeat(70_000)}{"value":1}`,
    })
    expect(await readUnboundedJsonBody(input)).toEqual({
      kind: 'ok',
      value: { value: 1 },
    })
    expect(await readUnboundedJsonBody(request({ body: '{' }))).toEqual({
      kind: 'invalid_body',
    })
  })

  it('writes only the given JSON body/status with no-store', async () => {
    const response = jsonNoStore({
      body: { status: 'error', code: 'invalid_request' },
      status: 409,
    })
    expect(response.status).toBe(409)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({
      status: 'error',
      code: 'invalid_request',
    })
  })
})
