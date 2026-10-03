import { handleSearchRequest } from '@/features/recipients/server'
import { checkAccount } from '@/lib/green-api/check-account'
import { readRouteSession } from '@/server/session'

export const POST = async (request: Request): Promise<Response> => {
  const { configured, context, clearSession } = await readRouteSession()
  return handleSearchRequest({
    request,
    context: { configured, credentials: context?.credentials ?? null },
    lookup: checkAccount,
    clearSession,
  })
}
