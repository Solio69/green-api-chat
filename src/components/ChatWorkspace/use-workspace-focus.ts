'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import type { FocusEvent } from 'react'
import type { ConversationSelection } from '@/lib/conversations/types'
import { CONVERSATION_PANEL } from '@/lib/conversations/constants'
import { WORKSPACE_FOCUS_SELECTORS } from './constants'

const { LIST } = CONVERSATION_PANEL
const { SELECTED_CHAT, OTHER_CHAT, AVAILABLE_CONTROL } =
  WORKSPACE_FOCUS_SELECTORS

type WorkspaceFocusOptions = Pick<
  ConversationSelection,
  'target' | 'accessId' | 'mobilePanel'
>

export const useWorkspaceFocus = ({
  target,
  accessId,
  mobilePanel,
}: WorkspaceFocusOptions) => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusedElementRef = useRef<Element | null>(null)
  const previous = useRef({ target, accessId, mobilePanel })

  const findHiddenFocusedPanel = (focused: Element | null) => {
    const sidebar = sidebarRef.current
    const pane = paneRef.current
    const isHiddenSidebarFocused =
      sidebar !== null &&
      sidebar.contains(focused) &&
      sidebar.getClientRects().length === 0
    if (isHiddenSidebarFocused) return sidebar
    const isHiddenPaneFocused =
      pane !== null &&
      pane.contains(focused) &&
      pane.getClientRects().length === 0
    if (isHiddenPaneFocused) return pane
    return null
  }

  const handleFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    focusedElementRef.current = event.target
  }
  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    const focusStaysInside =
      next instanceof Element && event.currentTarget.contains(next)
    if (focusStaysInside) return
    const lostWhileHiding =
      next === null &&
      findHiddenFocusedPanel(focusedElementRef.current) !== null
    // CSS hiding can blur before ResizeObserver reports the new panel size.
    if (lostWhileHiding) return
    focusedElementRef.current = null
  }

  const focusList = useEffectEvent(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return
    const action =
      sidebar.querySelector<HTMLElement>(SELECTED_CHAT) ??
      sidebar.querySelector<HTMLElement>(OTHER_CHAT) ??
      sidebar.querySelector<HTMLElement>(AVAILABLE_CONTROL)
    const destination = action ?? sidebar
    destination.focus()
  })
  const recoverFocus = useEffectEvent(() => {
    const hiddenPanel = findHiddenFocusedPanel(focusedElementRef.current)
    if (!hiddenPanel) return
    const isHiddenSidebar =
      hiddenPanel === sidebarRef.current && target !== null
    if (isHiddenSidebar) headingRef.current?.focus()
    else if (hiddenPanel === paneRef.current) focusList()
  })

  useEffect(() => {
    const sidebar = sidebarRef.current
    const pane = paneRef.current
    const isWorkspaceMounted = sidebar !== null && pane !== null
    if (!isWorkspaceMounted) return
    const observer = new ResizeObserver(recoverFocus)
    observer.observe(sidebar)
    observer.observe(pane)
    window.addEventListener('resize', recoverFocus)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recoverFocus)
    }
  }, [])

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return
    const opened = previous.current.accessId !== accessId
    const returned =
      previous.current.mobilePanel !== mobilePanel && mobilePanel === LIST
    const closed = previous.current.target !== null && target === null
    const openedOnMobile = opened && sidebar.getClientRects().length === 0
    const shouldFocusList = returned || closed
    if (openedOnMobile) headingRef.current?.focus()
    else if (shouldFocusList) focusList()
    previous.current = { target, accessId, mobilePanel }
  }, [target, accessId, mobilePanel])

  return {
    sidebarRef,
    paneRef,
    headingRef,
    handleFocusCapture,
    handleBlurCapture,
  }
}
