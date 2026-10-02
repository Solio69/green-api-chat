import { HistoryProbe } from '../components/HistoryProbe'
import { QueryProbe } from '../components/QueryProbe'
import { SelectionProbe } from '../components/SelectionProbe'
import { SessionOverlayProbe } from '../components/SessionOverlayProbe'

const FixturePage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    selection?: string
    history?: string
    overlay?: string
  }>
}) => {
  const { selection, history, overlay } = await searchParams
  if (overlay) return <SessionOverlayProbe />
  if (history) return <HistoryProbe />
  return selection ? <SelectionProbe /> : <QueryProbe />
}
export default FixturePage
