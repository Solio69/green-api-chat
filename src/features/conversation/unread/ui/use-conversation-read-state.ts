'use client'

import { useEffect, useEffectEvent } from 'react'
import type { RefObject } from 'react'
import type { ConversationSelection } from '@/features/conversation/selection/model'
import { setReadableConversation } from '@/features/conversation/unread/application/unread-cache'
import { useOptionalQuerySession } from '@/shared/query/ui'
import {
  UNREAD_CONFIG,
  UNREAD_VISIBILITY,
} from '@/features/conversation/unread/model/constants'

const { PROVIDER_REQUIRED } = UNREAD_CONFIG
const { VISIBLE, CHANGE_EVENT } = UNREAD_VISIBILITY

export const useConversationReadState = ({
  paneRef,
  target,
  accessId,
  mobilePanel,
}: Pick<ConversationSelection, 'target' | 'accessId' | 'mobilePanel'> & {
  paneRef: RefObject<HTMLDivElement | null>
}) => {
  const session = useOptionalQuerySession()
  if (!session) throw new Error(PROVIDER_REQUIRED)
  const updateReadableConversation = useEffectEvent(() => {
    const pane = paneRef.current
    const canRead =
      document.visibilityState === VISIBLE &&
      pane !== null &&
      pane.getClientRects().length > 0
    setReadableConversation({
      session,
      chatId: canRead ? (target?.chatId ?? null) : null,
    })
  })

  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    const observer = new ResizeObserver(updateReadableConversation)
    observer.observe(pane)
    document.addEventListener(CHANGE_EVENT, updateReadableConversation)
    updateReadableConversation()
    return () => {
      observer.disconnect()
      document.removeEventListener(CHANGE_EVENT, updateReadableConversation)
      setReadableConversation({ session, chatId: null })
    }
  }, [paneRef, session])

  useEffect(() => {
    updateReadableConversation()
  }, [target, accessId, mobilePanel])
}
