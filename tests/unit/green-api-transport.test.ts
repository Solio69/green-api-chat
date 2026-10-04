import { describe, expect, it } from 'vitest'
import { fetchGreenApi } from '@/server/green-api/transport'

const credentials = {
  idInstance: 'fictional/id',
  apiTokenInstance: 'fictional token/value',
}
const ROOT = 'https://4100.api.green-api.com/waInstancefictional%2Fid'
const token = 'fictional%20token%2Fvalue'

describe('GREEN-API transport', () => {
  it('encodes both credentials, passes safe GET options and returns the original response', async () => {
    const signal = new AbortController().signal
    const expected = new Response('raw provider body')
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ input, init })
      return expected
    }
    const actual = await fetchGreenApi({
      credentials,
      methodName: 'getChats',
      method: 'GET',
      signal,
      fetcher,
    })
    expect(actual).toBe(expected)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({
      input: `${ROOT}/getChats/${token}`,
      init: {
        method: 'GET',
        cache: 'no-store',
        redirect: 'error',
        signal,
      },
    })
  })

  it('serializes explicit JSON bodies for POST and preserves the caller signal', async () => {
    const signal = new AbortController().signal
    const body = { chatId: 'fictional@c.us', message: 'Hi' }
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ input, init })
      return new Response('{}')
    }
    await fetchGreenApi({
      credentials,
      methodName: 'sendMessage',
      method: 'POST',
      jsonBody: body,
      signal,
      fetcher,
    })
    expect(calls).toEqual([
      {
        input: `${ROOT}/sendMessage/${token}`,
        init: {
          method: 'POST',
          cache: 'no-store',
          redirect: 'error',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      },
    ])
  })

  it('appends DELETE suffix and omits JSON options when no body is supplied', async () => {
    const signal = new AbortController().signal
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ input, init })
      return new Response('true')
    }
    await fetchGreenApi({
      credentials,
      methodName: 'deleteNotification',
      method: 'DELETE',
      suffix: '/42',
      signal,
      fetcher,
    })
    expect(calls).toEqual([
      {
        input: `${ROOT}/deleteNotification/${token}/42`,
        init: {
          method: 'DELETE',
          cache: 'no-store',
          redirect: 'error',
          signal,
        },
      },
    ])
  })

  it('makes exactly one request and propagates a fetch failure untouched', async () => {
    const failure = new Error('fictional network failure')
    let calls = 0
    const fetcher: typeof fetch = async () => {
      calls += 1
      throw failure
    }
    await expect(
      fetchGreenApi({
        credentials,
        methodName: 'receiveNotification',
        method: 'GET',
        suffix: '?receiveTimeout=5',
        signal: new AbortController().signal,
        fetcher,
      }),
    ).rejects.toBe(failure)
    expect(calls).toBe(1)
  })

  it('serializes an explicit JSON null rather than treating it as omitted body', async () => {
    let options: RequestInit | undefined
    const fetcher: typeof fetch = async (_input, init) => {
      options = init
      return new Response('{}')
    }
    await fetchGreenApi({
      credentials,
      methodName: 'checkAccount',
      method: 'POST',
      jsonBody: null,
      signal: new AbortController().signal,
      fetcher,
    })
    expect(options?.body).toBe('null')
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
  })
})
