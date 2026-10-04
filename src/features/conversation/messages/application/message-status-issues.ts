import { isPersonalChatId, isChatId } from '@/features/chats/model'
import type { ChatIssueFact } from '@/features/conversation/messages/model/types'
import type { QuerySession } from '@/shared/query/create-query-session'
import {
  MESSAGE_CACHE_CONFIG,
  MESSAGE_STATUS,
} from '@/features/conversation/messages/model/constants'

const { ISSUES_KEY, INVALID_FACTS } = MESSAGE_CACHE_CONFIG
const { FAILED, NO_ACCOUNT } = MESSAGE_STATUS
export const messageIssuesKey = (connectionScope: string) =>
  [ISSUES_KEY, connectionScope] as const
export const publishMessageIssues = ({
  session,
  issues,
}: {
  session: QuerySession
  issues: ChatIssueFact[]
}): void => {
  if (!session.isActive()) return
  const valid = issues.every(
    (issue) =>
      (issue.chatId === null || isPersonalChatId(issue.chatId)) &&
      (issue.idMessage === null || isChatId(issue.idMessage)) &&
      (issue.code === FAILED || issue.code === NO_ACCOUNT),
  )
  if (!valid) throw new Error(INVALID_FACTS)
  if (issues.length === 0) return
  session.client.setQueryData<ChatIssueFact[]>(
    messageIssuesKey(session.connectionScope),
    (current = []) => {
      const latest = new Map(current.map((issue) => [issue.chatId, issue]))
      let changed = false
      for (const issue of issues) {
        const previous = latest.get(issue.chatId)
        const duplicate =
          previous?.idMessage === issue.idMessage &&
          previous?.code === issue.code
        if (duplicate) continue
        latest.set(issue.chatId, { ...issue })
        changed = true
      }
      return changed ? [...latest.values()] : current
    },
  )
}
