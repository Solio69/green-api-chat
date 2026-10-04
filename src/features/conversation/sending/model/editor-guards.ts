import type { ConversationTarget } from '@/features/conversation/selection/model'

export type SendInput = {
  target: ConversationTarget
  text: string
  selectionEpoch: number
  editorRevision: number
}
export type PendingAttempt = SendInput & { attemptId: string }

export type MessageEditor = {
  chatId: string | null
  selectionEpoch: number
  revision: number
  text: string
  historyChecked: boolean
}
export const matchesEditorSnapshot = ({
  editor,
  snapshot,
}: {
  editor: MessageEditor
  snapshot: PendingAttempt
}) =>
  editor.chatId === snapshot.target.chatId &&
  editor.selectionEpoch === snapshot.selectionEpoch &&
  editor.revision === snapshot.editorRevision
