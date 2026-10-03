import { describe, expect, it } from 'vitest'
import { chatsQueryOptions } from '@/lib/chats/chats-query-options'
import { createConnectionSession } from '@/lib/conversations/create-connection-session'
import { createQuerySession } from '@/lib/query/create-query-session'

const scope = 'fictional-connection-scope'
const memoryPrefixes = [
  'messages',
  'message-status-facts',
  'message-status-issues',
  'session-chats',
  'chat-unread',
]

describe('connection memory ownership', () => {
  it('leaves feature query policy out of the generic session', async () => {
    const session = createQuerySession({ connectionScope: scope })
    expect('options' in session).toBe(false)
    for (const prefix of memoryPrefixes)
      expect(session.client.getQueryDefaults([prefix])).not.toHaveProperty(
        'gcTime',
      )
    await session.close()
  })

  it('configures scoped chat and retained memory through connection composition', async () => {
    const session = createConnectionSession({ connectionScope: scope })
    const options = chatsQueryOptions(session)
    expect(options).toMatchObject({
      queryKey: ['chats', scope],
      staleTime: 60_000,
      gcTime: 300_000,
      retry: false,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    })
    for (const prefix of memoryPrefixes)
      expect(session.client.getQueryDefaults([prefix])).toMatchObject({
        enabled: false,
        gcTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      })
    session.client.setQueryData(
      ['messages', scope, 'fictional-chat'],
      ['fictional-message'],
    )
    await session.close()
    expect(session.client.getQueryCache().getAll()).toHaveLength(0)
    await session.close()
  })
})
