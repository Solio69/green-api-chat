import { isRecord } from '@/lib/api/is-record'
import { TEST_API_RESPONSE } from '../../../../../protocol.constants'
import { notificationFixture } from '../../../lib/notification-fixture'

const { OK } = TEST_API_RESPONSE
const BAD_REQUEST = 400

export const GET = () => Response.json(notificationFixture.state)
export const POST = async (request: Request) => {
  const value: unknown = await request.json()
  if (!isRecord(value)) return new Response(null, { status: BAD_REQUEST })
  if (value.reset === true) notificationFixture.reset()
  if (typeof value.sendDelay === 'number')
    notificationFixture.state.sendDelay = value.sendDelay
  if (typeof value.unknown === 'boolean')
    notificationFixture.state.unknown = value.unknown
  if (isRecord(value.event)) notificationFixture.inject(value.event)
  return Response.json({ status: OK })
}
