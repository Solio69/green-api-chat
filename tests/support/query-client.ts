import { QueryClient } from '@tanstack/react-query'
import { onTestFinished } from 'vitest'

export const createTestQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  onTestFinished(() => client.clear())
  return client
}
