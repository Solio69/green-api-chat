'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createQuerySession } from '@/lib/query/create-query-session'
import type { QuerySession } from '@/lib/query/create-query-session'
import { API_ERROR_CODE } from '@/lib/api/constants'
import { ROUTES } from '@/lib/routes/constants'

const { SESSION_REQUIRED } = API_ERROR_CODE
const { LOGIN } = ROUTES
const QuerySessionContext = createContext<QuerySession | null>(null)
type QueryProviderProps = { connectionScope: string; children: ReactNode }
export const QueryProvider = ({
  connectionScope,
  children,
}: QueryProviderProps) => {
  const router = useRouter()
  const [session] = useState(() =>
    createQuerySession({
      connectionScope,
      onSessionError: (error) => {
        if (error.code === SESSION_REQUIRED) router.replace(LOGIN)
        router.refresh()
      },
    }),
  )
  useEffect(() => session.retain(), [session])
  return (
    <QuerySessionContext.Provider value={session}>
      <QueryClientProvider client={session.client}>
        {children}
      </QueryClientProvider>
    </QuerySessionContext.Provider>
  )
}
export const useOptionalQuerySession = () => useContext(QuerySessionContext)
