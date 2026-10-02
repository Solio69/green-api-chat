import type {
  ConversationSelection,
  ConversationSelectionAction,
} from './types'
import { CONVERSATION_ACTION, CONVERSATION_PANEL } from './constants'

const { OPEN, SHOW_LIST, CLOSE } = CONVERSATION_ACTION
const { LIST, CONVERSATION } = CONVERSATION_PANEL

export const createConversationSelection = (): ConversationSelection => ({
  target: null,
  accessId: 0,
  selectionEpoch: 0,
  mobilePanel: LIST,
})

export const reduceConversationSelection = ({
  state,
  action,
}: {
  state: ConversationSelection
  action: ConversationSelectionAction
}): ConversationSelection => {
  switch (action.type) {
    case OPEN: {
      const { chatId, label } = action.target
      if (!chatId.trim()) return state
      const isSameChat = state.target?.chatId === chatId
      return {
        target: { chatId, label: label.trim() || chatId },
        accessId: state.accessId + 1,
        selectionEpoch: state.selectionEpoch + (isSameChat ? 0 : 1),
        mobilePanel: CONVERSATION,
      }
    }
    case SHOW_LIST:
      return { ...state, mobilePanel: LIST }
    case CLOSE:
      return {
        ...state,
        target: null,
        selectionEpoch: state.selectionEpoch + (state.target ? 1 : 0),
        mobilePanel: LIST,
      }
  }
}
