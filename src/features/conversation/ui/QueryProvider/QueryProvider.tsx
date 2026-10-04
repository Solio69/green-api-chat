'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createConnectionSession } from '@/features/conversation/application/create-connection-session'
import { QuerySessionProvider } from '@/shared/query/ui'
import { API_ERROR_CODE } from '@/shared/kernel/api/constants'
import { ROUTES } from '@/shared/kernel/routes/constants'

const { SESSION_REQUIRED } = API_ERROR_CODE
const { LOGIN } = ROUTES
type QueryProviderProps = { connectionScope: string; children: ReactNode }
export const QueryProvider = ({
  connectionScope,
  children,
}: QueryProviderProps) => {
  const router = useRouter()
  const [session] = useState(() =>
    createConnectionSession({
      connectionScope,
      onSessionError: (error) => {
        if (error.code === SESSION_REQUIRED) router.replace(LOGIN)
        router.refresh()
      },
    }),
  )
  useEffect(() => session.retain(), [session])
  return (
    <QuerySessionProvider session={session}>{children}</QuerySessionProvider>
  )
}
