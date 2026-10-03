import { HistoryProbe } from '../components/HistoryProbe'
import { MessagingProbe } from '../components/MessagingProbe'
import { QueryProbe } from '../components/QueryProbe'
import { SelectionProbe } from '../components/SelectionProbe'
import { UnreadProbe } from '../components/UnreadProbe'

const FixturePage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    selection?: string
    history?: string
    messaging?: string
    unread?: string
  }>
}) => {
  const { selection, history, messaging, unread } = await searchParams
  if (unread) return <UnreadProbe />
  if (messaging) return <MessagingProbe />
  if (history) return <HistoryProbe />
  return selection ? <SelectionProbe /> : <QueryProbe />
}
export default FixturePage
