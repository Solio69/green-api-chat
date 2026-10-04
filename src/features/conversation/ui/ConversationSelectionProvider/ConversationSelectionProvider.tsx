'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import type {
  ConversationSelectionAccess,
  ConversationSelectionAction,
  ConversationTarget,
} from '@/features/conversation/selection/model'
import {
  createConversationSelection,
  reduceConversationSelection,
  CONVERSATION_ACTION,
} from '@/features/conversation/selection/model'
import { useOptionalQuerySession } from '@/shared/query/ui'
import { SELECTION_PROVIDER_ERRORS } from './constants'

const { OPEN, SHOW_LIST, CLOSE } = CONVERSATION_ACTION
const { QUERY_PROVIDER_REQUIRED, SELECTION_PROVIDER_REQUIRED } =
  SELECTION_PROVIDER_ERRORS

const SelectionContext = createContext<ConversationSelectionAccess | null>(null)
const inactiveSelection = createConversationSelection()

export const ConversationSelectionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(QUERY_PROVIDER_REQUIRED)
  const active = useSyncExternalStore(
    session.subscribe,
    session.isActive,
    session.isActive,
  )
  const [selection, setSelection] = useState(createConversationSelection)
  const dispatch = useCallback(
    (action: ConversationSelectionAction) => {
      if (!session.isActive()) return
      setSelection((state) =>
        session.isActive()
          ? reduceConversationSelection({ state, action })
          : state,
      )
    },
    [session],
  )
  const openConversation = useCallback(
    (target: ConversationTarget) => dispatch({ type: OPEN, target }),
    [dispatch],
  )
  const showChatList = useCallback(
    () => dispatch({ type: SHOW_LIST }),
    [dispatch],
  )
  const closeConversation = useCallback(
    () => dispatch({ type: CLOSE }),
    [dispatch],
  )
  const value = useMemo(
    () => ({
      ...(active ? selection : inactiveSelection),
      openConversation,
      showChatList,
      closeConversation,
    }),
    [active, selection, openConversation, showChatList, closeConversation],
  )
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  )
}

export const useConversationSelection = (): ConversationSelectionAccess => {
  const selection = useContext(SelectionContext)
  if (!selection) throw new Error(SELECTION_PROVIDER_REQUIRED)
  return selection
}
