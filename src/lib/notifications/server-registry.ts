import { createReceiverLoop } from './receiver-loop'
import { createReceiverRegistry } from './receiver-registry'
import { deleteNotification } from '@/lib/green-api/delete-notification'
import { getNotificationSettings } from '@/lib/green-api/get-notification-settings'
import { receiveNotification } from '@/lib/green-api/receive-notification'
import { NOTIFICATION_CONFIG } from './constants'

const { REGISTRY_KEY } = NOTIFICATION_CONFIG

const registryKey = Symbol.for(REGISTRY_KEY)
type Registry = ReturnType<typeof createReceiverRegistry>
type GlobalRegistry = typeof globalThis & { [registryKey]?: Registry }
export const getReceiverRegistry = (): Registry => {
  const processState: GlobalRegistry = globalThis
  const previous = processState[registryKey]
  const reusable =
    previous && (!previous.isInvalidated() || !previous.isDrained())
  if (reusable) return previous
  const provider = {
    settings: (
      context: Parameters<typeof getNotificationSettings>[0]['context'],
    ) => getNotificationSettings({ context }),
    receive: receiveNotification,
    delete: deleteNotification,
  }
  const registry = createReceiverRegistry({
    provider,
    startReceiver: (options) => createReceiverLoop({ ...options, provider }),
  })
  processState[registryKey] = registry
  return registry
}

type HotModule = NodeModule & {
  hot?: { dispose: (callback: () => void) => void }
}
if (typeof module !== 'undefined') {
  const hotModule = module as HotModule
  hotModule.hot?.dispose(() => {
    const processState: GlobalRegistry = globalThis
    processState[registryKey]?.invalidate()
  })
}
