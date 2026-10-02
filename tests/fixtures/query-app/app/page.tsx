import { HistoryProbe } from '../components/HistoryProbe'
import { MessagingProbe } from '../components/MessagingProbe'
import { QueryProbe } from '../components/QueryProbe'
import { SelectionProbe } from '../components/SelectionProbe'
import { SessionOverlayProbe } from '../components/SessionOverlayProbe'

const FixturePage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    selection?: string
    history?: string
    messaging?: string
    overlay?: string
  }>
}) => {
  const { selection, history, overlay, messaging } = await searchParams
  if (messaging) return <MessagingProbe />
  if (overlay) return <SessionOverlayProbe />
  if (history) return <HistoryProbe />
  return selection ? <SelectionProbe /> : <QueryProbe />
}
export default FixturePage
