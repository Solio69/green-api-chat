import type { CONVERSATION_ACTION, CONVERSATION_PANEL } from './constants'

export type ConversationTarget = { chatId: string; label: string }

export type ConversationSelection = {
  target: ConversationTarget | null
  accessId: number
  selectionEpoch: number
  mobilePanel: (typeof CONVERSATION_PANEL)[keyof typeof CONVERSATION_PANEL]
}

export type ConversationSelectionAction =
  | { type: typeof CONVERSATION_ACTION.OPEN; target: ConversationTarget }
  | { type: typeof CONVERSATION_ACTION.SHOW_LIST }
  | { type: typeof CONVERSATION_ACTION.CLOSE }

export type ConversationSelectionAccess = ConversationSelection & {
  openConversation: (target: ConversationTarget) => void
  showChatList: () => void
  closeConversation: () => void
}
