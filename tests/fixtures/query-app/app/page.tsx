import { HistoryProbe } from '../components/HistoryProbe'
import { MessagingProbe } from '../components/MessagingProbe'
import { QueryProbe } from '../components/QueryProbe'
import { SelectionProbe } from '../components/SelectionProbe'
import { SessionOverlayProbe } from '../components/SessionOverlayProbe'
import { UnreadProbe } from '../components/UnreadProbe'

const FixturePage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    selection?: string
    history?: string
    messaging?: string
    unread?: string
    overlay?: string
  }>
}) => {
  const { selection, history, overlay, messaging, unread } = await searchParams
  if (unread) return <UnreadProbe />
  if (messaging) return <MessagingProbe />
  if (overlay) return <SessionOverlayProbe />
  if (history) return <HistoryProbe />
  return selection ? <SelectionProbe /> : <QueryProbe />
}
export default FixturePage
