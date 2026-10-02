import { isRecord } from '@/lib/api/is-record'
import { API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_STATUS } from '@/lib/http/constants'
import { notificationFixture } from '../../../lib/notification-fixture'

const { OK } = API_RESPONSE_STATUS
const { BAD_REQUEST } = HTTP_STATUS

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
