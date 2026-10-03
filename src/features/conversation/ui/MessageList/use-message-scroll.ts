'use client'

import { useLayoutEffect, useRef } from 'react'
import type { UIEvent } from 'react'
import type { MessageDTO } from '@/lib/messages/types'
import { MESSAGE_SCROLL_CONFIG } from './constants'

const { BOTTOM_TOLERANCE } = MESSAGE_SCROLL_CONFIG
const readAnchor = (list: HTMLUListElement) => {
  const top = list.getBoundingClientRect().top
  const firstVisible = [...list.children].find(
    (node) => node.getBoundingClientRect().bottom > top,
  )
  return firstVisible
    ? {
        node: firstVisible,
        offset: firstVisible.getBoundingClientRect().top - top,
      }
    : null
}
export const useMessageScroll = (messages: MessageDTO[]) => {
  const listRef = useRef<HTMLUListElement>(null)
  const atBottom = useRef(true)
  const anchor = useRef<{ node: Element; offset: number } | null>(null)
  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    const list = event.currentTarget
    atBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <= BOTTOM_TOLERANCE
    anchor.current = readAnchor(list)
  }
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    if (atBottom.current) list.scrollTop = list.scrollHeight
    else if (anchor.current) {
      const { node, offset } = anchor.current
      if (list.contains(node))
        list.scrollTop +=
          node.getBoundingClientRect().top -
          list.getBoundingClientRect().top -
          offset
    }
    anchor.current = readAnchor(list)
  }, [messages])
  return { listRef, handleScroll }
}
