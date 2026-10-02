import { HistoryProbe } from '../components/HistoryProbe'
import { QueryProbe } from '../components/QueryProbe'
import { SelectionProbe } from '../components/SelectionProbe'

const FixturePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ selection?: string; history?: string }>
}) => {
  const { selection, history } = await searchParams
  if (history) return <HistoryProbe />
  return selection ? <SelectionProbe /> : <QueryProbe />
}
export default FixturePage
