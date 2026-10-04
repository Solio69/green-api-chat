import { readBoundedJsonBody } from '@/server/http'
import { SEND_CONFIG } from '@/features/conversation/sending/model/constants'
import {
  API_ERROR_CODE,
  API_RESPONSE_STATUS,
} from '@/shared/kernel/api/constants'

const { INVALID_REQUEST } = API_ERROR_CODE
const { OK } = API_RESPONSE_STATUS
const { MAX_BODY_BYTES } = SEND_CONFIG
const TOO_LARGE = 'too_large'

export type SendBodyResult =
  | { kind: typeof OK; value: unknown }
  | { kind: typeof INVALID_REQUEST | typeof TOO_LARGE }

export const readSendBody = async (
  request: Request,
): Promise<SendBodyResult> => {
  const result = await readBoundedJsonBody({
    request,
    maxBytes: MAX_BODY_BYTES,
    contentLengthPolicy: 'ignore',
  })
  if (result.kind === 'ok') return { kind: OK, value: result.value }
  if (result.kind === 'too_large') return { kind: TOO_LARGE }
  return { kind: INVALID_REQUEST }
}
