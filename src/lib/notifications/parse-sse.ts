import { TEXT_ENCODING } from '@/lib/http/constants'
import { EMPTY_STRING } from '@/lib/ui/constants'
import { NOTIFICATION_CONFIG } from './constants'

const { UTF_8 } = TEXT_ENCODING
const {
  MAX_FRAME_BYTES,
  STREAM_ERROR,
  SSE_DEFAULT_EVENT,
  SSE_EVENT_PREFIX,
  SSE_DATA_PREFIX,
  SSE_LINE_BREAK,
} = NOTIFICATION_CONFIG

export type SseFrame = { event: string; data: string }

export const createSseParser = () => {
  const decoder = new TextDecoder(UTF_8, { fatal: true })
  const encoder = new TextEncoder()
  let buffer = EMPTY_STRING
  const consume = (text: string) => {
    buffer += text
    const frames: SseFrame[] = []
    while (true) {
      const delimiter = /\r?\n\r?\n/.exec(buffer)
      if (!delimiter) break
      const frame = buffer.slice(0, delimiter.index)
      if (encoder.encode(frame).byteLength > MAX_FRAME_BYTES)
        throw new Error(STREAM_ERROR)
      buffer = buffer.slice(delimiter.index + delimiter[0].length)
      let event = SSE_DEFAULT_EVENT as string
      const lines: string[] = []
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith(SSE_EVENT_PREFIX))
          event = line
            .slice(SSE_EVENT_PREFIX.length)
            .replace(/^ /, EMPTY_STRING)
        else if (line.startsWith(SSE_DATA_PREFIX))
          lines.push(
            line.slice(SSE_DATA_PREFIX.length).replace(/^ /, EMPTY_STRING),
          )
      }
      if (lines.length > 0)
        frames.push({
          event,
          data: lines.join(SSE_LINE_BREAK),
        })
    }
    if (encoder.encode(buffer).byteLength > MAX_FRAME_BYTES)
      throw new Error(STREAM_ERROR)
    return frames
  }
  return {
    push: (value: Uint8Array) =>
      consume(decoder.decode(value, { stream: true })),
    finish: () => consume(decoder.decode()),
  }
}
