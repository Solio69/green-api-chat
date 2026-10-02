import type { createReceiverRegistry } from './receiver-registry'
import type { ReceiverContext } from './types'
import { API_RESPONSE_STATUS } from '@/lib/api/constants'
import { HTTP_HEADERS } from '@/lib/http/constants'
import { NOTIFICATION_CONFIG, NOTIFICATION_EVENT } from './constants'

const { OK: RESULT_OK } = API_RESPONSE_STATUS
const { HEARTBEAT } = NOTIFICATION_EVENT
const { CONTENT_TYPE, CACHE_CONTROL } = HTTP_HEADERS

const {
  HEARTBEAT_MS,
  SSE_CONTENT_TYPE,
  SSE_CACHE_CONTROL,
  BUFFERING_HEADER,
  BUFFERING_DISABLED,
} = NOTIFICATION_CONFIG
export const createNotificationStream = ({
  request,
  context,
  registry,
}: {
  request: Request
  context: ReceiverContext
  registry: ReturnType<typeof createReceiverRegistry>
}): Response | { code: string } => {
  let generation: number | null = null
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let closed = false
  let controller: ReadableStreamDefaultController<Uint8Array>
  const encoder = new TextEncoder()
  const detach = () => {
    if (closed) return
    closed = true
    clearInterval(heartbeat)
    request.signal.removeEventListener('abort', close)
    if (generation !== null)
      registry.detachOwner({ context, streamGeneration: generation })
  }
  const close = () => {
    detach()
    try {
      controller.close()
    } catch {
      /* The stream may have been cancelled. */
    }
  }
  const emit = ({ event, data }: { event: string; data: unknown }) => {
    if (closed) return false
    const overloaded =
      controller.desiredSize !== null && controller.desiredSize < 0
    if (overloaded) {
      close()
      return false
    }
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    )
    return true
  }
  const stream = new ReadableStream<Uint8Array>({
    start: (streamController) => {
      controller = streamController
    },
    cancel: detach,
  })
  const attached = registry.attachOwner({ context, sink: { emit, close } })
  if (attached.kind !== RESULT_OK) {
    close()
    return { code: attached.code }
  }
  generation = attached.streamGeneration
  if (closed) registry.detachOwner({ context, streamGeneration: generation })
  request.signal.addEventListener('abort', close, { once: true })
  if (request.signal.aborted) close()
  if (!closed)
    heartbeat = setInterval(
      () =>
        emit({
          event: HEARTBEAT,
          data: {
            connectionScope: context.connectionScope,
            ownerEpoch: attached.ownerEpoch,
          },
        }),
      HEARTBEAT_MS,
    )
  heartbeat?.unref?.()
  return new Response(stream, {
    headers: {
      [CONTENT_TYPE]: SSE_CONTENT_TYPE,
      [CACHE_CONTROL]: SSE_CACHE_CONTROL,
      [BUFFERING_HEADER]: BUFFERING_DISABLED,
    },
  })
}
