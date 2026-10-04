import { configureConnectionMemory } from './configure-connection-memory'
import { createQuerySession } from '@/shared/query/create-query-session'

export const createConnectionSession = (
  options: Parameters<typeof createQuerySession>[0],
) => {
  const session = createQuerySession(options)
  configureConnectionMemory(session.client)
  return session
}
