'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import { deriveUnreadCounts, unreadKey } from './unread-cache'
import type { UnreadCache } from './unread-cache'
import { UNREAD_CONFIG } from './constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { PROVIDER_REQUIRED } = UNREAD_CONFIG
export const useUnreadCounts = () => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const { data } = useQuery<UnreadCache>({
    queryKey: unreadKey(session.connectionScope),
    enabled: false,
  })
  return useMemo(
    () => deriveUnreadCounts(active ? data : undefined),
    [active, data],
  )
}
