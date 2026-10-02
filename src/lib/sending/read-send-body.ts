import { API_ERROR_CODE, API_RESPONSE_STATUS } from '@/lib/api/constants'
import {
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_SYNTAX,
  TEXT_ENCODING,
} from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { SEND_CONFIG } from './constants'

const { INVALID_REQUEST } = API_ERROR_CODE
const { OK } = API_RESPONSE_STATUS
const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX
const { UTF_8 } = TEXT_ENCODING
const { MAX_BODY_BYTES } = SEND_CONFIG
const TOO_LARGE = 'too_large'

export type SendBodyResult =
  | { kind: typeof OK; value: unknown }
  | { kind: typeof INVALID_REQUEST | typeof TOO_LARGE }

export const readSendBody = async (
  request: Request,
): Promise<SendBodyResult> => {
  const mediaType = request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== JSON_CONTENT_TYPE) return { kind: INVALID_REQUEST }
  const reader = request.body?.getReader()
  if (!reader) return { kind: INVALID_REQUEST }
  let size = 0
  let text = EMPTY_STRING
  const decoder = new TextDecoder(UTF_8, { fatal: true })
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        // Cancellation failure does not change the established size violation.
        await reader.cancel().catch(() => undefined)
        return { kind: TOO_LARGE }
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    return { kind: OK, value: JSON.parse(text) }
  } catch {
    await reader.cancel().catch(() => undefined)
    return { kind: INVALID_REQUEST }
  } finally {
    reader.releaseLock()
  }
}
