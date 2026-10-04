'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import {
  deriveUnreadCounts,
  unreadKey,
} from '@/features/conversation/unread/application/unread-cache'
import type { UnreadCache } from '@/features/conversation/unread/application/unread-cache'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { UNREAD_CONFIG } from '@/features/conversation/unread/model/constants'

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
