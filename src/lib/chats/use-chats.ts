'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { ChatsQueryError } from './types'
import { CHAT_QUERY_CONFIG } from './constants'
import { useOptionalQuerySession } from '@/components/QueryProvider'

const { PROVIDER_REQUIRED } = CHAT_QUERY_CONFIG
export const useChats = () => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const result = useQuery({ ...session.options(), enabled: active })
  const refetch = async (): Promise<void> => {
    const canRefetch = session.isActive() && !result.isFetching
    if (canRefetch) await result.refetch({ cancelRefetch: false })
  }
  return {
    data: active ? result.data : undefined,
    isPending: active && result.isPending,
    isFetching: active && result.isFetching,
    error:
      active && result.error instanceof ChatsQueryError ? result.error : null,
    refetch,
  }
}
