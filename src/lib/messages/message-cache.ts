import { mergeMessageFacts } from './merge-message-facts'
import type { MessageDTO, MessageApplyResult, MessageCache } from './types'
import { isMessageDTO } from './validate-message'
import { isPersonalChatId } from '@/lib/chats/validate-chat-id'
import type { QuerySession } from '@/lib/query/create-query-session'
import { MESSAGE_CACHE_CONFIG } from './constants'

const { KEY, INVALID_FACTS } = MESSAGE_CACHE_CONFIG

export const messageKey = ({
  connectionScope,
  chatId,
}: {
  connectionScope: string
  chatId: string | null
}) => [KEY, connectionScope, chatId] as const

export const applyHistoryMessages = ({
  session,
  chatId,
  messages,
}: {
  session: QuerySession
  chatId: string
  messages: MessageDTO[]
}): MessageApplyResult => {
  if (!session.isActive()) return { issues: [] }
  const valid =
    isPersonalChatId(chatId) &&
    messages.every(
      (message) => isMessageDTO(message) && message.chatId === chatId,
    )
  if (!valid) throw new Error(INVALID_FACTS)
  let issues: MessageApplyResult['issues'] = []
  session.client.setQueryData<MessageCache>(
    messageKey({ connectionScope: session.connectionScope, chatId }),
    (current) => {
      const result = mergeMessageFacts({
        current: current?.messages ?? [],
        messages,
      })
      issues = result.issues
      return { messages: result.messages }
    },
  )
  return { issues }
}
