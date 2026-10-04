import { isJsonMediaType } from './is-json-media-type'
import { HTTP_HEADERS, TEXT_ENCODING } from '@/shared/kernel/http/constants'
import { EMPTY_STRING } from '@/shared/kernel/ui/constants'

const { CONTENT_LENGTH } = HTTP_HEADERS
const { UTF_8 } = TEXT_ENCODING

export type JsonBodyResult =
  | { kind: 'ok'; value: unknown }
  | { kind: 'invalid_media_type' | 'invalid_body' | 'too_large' }

export const readBoundedJsonBody = async ({
  request,
  maxBytes,
  contentLengthPolicy,
}: {
  request: Request
  maxBytes: number
  contentLengthPolicy: 'ignore' | 'reject_invalid_or_excess'
}): Promise<JsonBodyResult> => {
  if (!isJsonMediaType(request)) return { kind: 'invalid_media_type' }
  if (contentLengthPolicy === 'reject_invalid_or_excess') {
    const length = request.headers.get(CONTENT_LENGTH)
    const invalidLength =
      length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)
    if (invalidLength) return { kind: 'invalid_body' }
  }
  const reader = request.body?.getReader()
  if (!reader) return { kind: 'invalid_body' }
  const decoder = new TextDecoder(UTF_8, { fatal: true })
  let bytes = 0
  let text = EMPTY_STRING
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return { kind: 'too_large' }
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    return { kind: 'ok', value: JSON.parse(text + decoder.decode()) as unknown }
  } catch {
    await reader.cancel().catch(() => undefined)
    return { kind: 'invalid_body' }
  } finally {
    reader.releaseLock()
  }
}

export const readUnboundedJsonBody = async (
  request: Request,
): Promise<{ kind: 'ok'; value: unknown } | { kind: 'invalid_body' }> => {
  try {
    return { kind: 'ok', value: (await request.json()) as unknown }
  } catch {
    return { kind: 'invalid_body' }
  }
}
