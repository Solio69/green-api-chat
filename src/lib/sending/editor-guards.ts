import type { PendingAttempt } from './create-send-controller'

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
