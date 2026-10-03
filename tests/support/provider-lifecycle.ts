import { vi } from 'vitest'
import { HTTP_HEADERS } from '@/lib/http/constants'
import { NOTIFICATION_ROUTES } from '@/lib/notifications/constants'

const { SETTINGS, RECEIVE } = NOTIFICATION_ROUTES
const { CONNECTION_SCOPE } = HTTP_HEADERS

export const createLifecycleTransport = () => {
  const requests: {
    url: string
    scope: string | null
    signal: AbortSignal | null | undefined
    respond: (body: object) => void
  }[] = []
  const fetcher = vi.fn<typeof fetch>((input, init) => {
    const url = String(input)
    const scope = new Headers(init?.headers).get(CONNECTION_SCOPE)
    const deferred = Promise.withResolvers<Response>()
    const respond = (body: object) =>
      deferred.resolve(
        Response.json({ status: 'ok', connectionScope: scope, ...body }),
      )
    requests.push({ url, scope, signal: init?.signal, respond })
    if (url === SETTINGS) respond({ outgoingEnabled: true })
    return deferred.promise
  })
  const receives = () => requests.filter(({ url }) => url === RECEIVE)
  const finish = () => {
    for (const request of requests)
      request.respond({ delivery: null, ackToken: null })
  }
  return { requests, fetcher, receives, finish }
}
