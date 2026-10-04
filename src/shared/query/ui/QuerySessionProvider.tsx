'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { QuerySession } from '@/shared/query/create-query-session'

const QuerySessionContext = createContext<QuerySession | null>(null)

export const QuerySessionProvider = ({
  session,
  children,
}: {
  session: QuerySession
  children: ReactNode
}) => (
  <QuerySessionContext.Provider value={session}>
    <QueryClientProvider client={session.client}>
      {children}
    </QueryClientProvider>
  </QuerySessionContext.Provider>
)

export const useOptionalQuerySession = () => useContext(QuerySessionContext)
