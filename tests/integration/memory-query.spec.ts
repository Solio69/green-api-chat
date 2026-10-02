import { expect, test } from '@playwright/test'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createQuerySession } from '@/lib/query/create-query-session'
import { HISTORY_TEST, MESSAGE_CACHE_TEST } from '../history/constants'

const { scopeA, chatA, message } = HISTORY_TEST
const { MESSAGE_KEY, SESSION_CHAT_KEY, STATUS_FACTS_KEY, ISSUES_KEY } =
  MESSAGE_CACHE_TEST
const MemoryConsumer = ({ queryKey }: { queryKey: QueryKey }) => {
  const { data } = useQuery({ queryKey, enabled: false })
  return createElement('output', null, JSON.stringify(data))
}

for (const prefix of [
  MESSAGE_KEY,
  SESSION_CHAT_KEY,
  STATUS_FACTS_KEY,
  ISSUES_KEY,
]) {
  test(`memory query: ${prefix} reads retained cache without development console errors`, async () => {
    const session = createQuerySession({ connectionScope: scopeA })
    const queryKey = [prefix, scopeA, chatA]
    const errors: unknown[][] = []
    const originalError = console.error
    console.error = (...args: unknown[]) => errors.push(args)
    try {
      session.client.setQueryData(queryKey, { messages: [message] })
      const markup = renderToString(
        createElement(
          QueryClientProvider,
          {
            client: session.client,
          },
          createElement(MemoryConsumer, { queryKey }),
        ),
      )
      expect(markup).toContain(message.idMessage)
      expect(errors).toEqual([])
      expect(session.client.isFetching()).toBe(0)
    } finally {
      console.error = originalError
      await session.close()
    }
  })
}
