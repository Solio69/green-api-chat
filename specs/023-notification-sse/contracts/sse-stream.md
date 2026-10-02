# Формат SSE доставки

**Проверки**: PassedSynthetic; Operator NotRun. UTF8 events отделены пустой строкой; fetch parser соблюдает LF/CRLF, split codepoints и несколько data lines. Формат [MDN SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

Каноническое событие `notification` содержит JSON:

```ts
type NotificationDelivery = {
  connectionScope: string
  ownerEpoch: string
  deliveryId: string
  event:
    | {
        kind: 'incoming_message'
        chatId: string
        message: MessageDTO
        displayLabel: string | null
      }
    | { kind: 'message_status'; fact: ProviderStatusFact }
    | { kind: 'ignored'; reason: 'out_of_scope' | 'unsupported_event' }
}
```

MessageDTO — точная модель [019 message-cache](../../019-chat-history-window/contracts/message-cache.md), direction incoming, acceptedAt=null, kind text/unsupported, provider timestamp; ProviderStatusFact — wire fact с nullable correlation по [024](../../024-message-statuses/contracts/message-statuses.md). receiptId, instanceData, token, capability, phone/downloadUrl не передаются. ownerEpoch — не секрет доступа и не основание ACK без server capability. `deliveryId` не равен idMessage, не сортирует переписку. Поле SSE `id:` допустимо как deliveryId, но клиент не использует Last-Event-ID как replay authorization; durable replay отсутствует.

Другие events:

| Event            | Payload                                    | Клиент                                                            |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| ready            | `{connectionScope,ownerEpoch}`             | Matching scope/epoch; connected; recovery refresh выбранного чата |
| receiver_state   | `{connectionScope,ownerEpoch,state,code?}` | receiving/retrying/paused; безопасный код, noACK                  |
| heartbeat        | `{connectionScope,ownerEpoch}`             | Transport liveness каждые 10 сек, не сообщение/ACK                |
| connection_error | `{connectionScope,ownerEpoch,code}`        | Auth close или pause/reconnect по коду; noACK                     |

Parser не буферизует бесконечно: размер одного незавершённого event не выше 128KiB; превышение/invalid UTF8/JSON/required schema — close/pause с безопасной ошибкой, не ACK. Это лимит нормализованного транспортного frame, не новая длина SendMessage; текстовый Send лимит 020 остаётся его контрактом. Валидный ignored event обрабатывается no-op и ACK. Неизвестное имя технического SSE event с валидной framing не считается notification delivery и не ACK; heartbeat stream не маскирует ошибку notification JSON. Raw invalid data не логировать.

В attached одновременно одна pending notification, поэтому backpressure sink не требует сервера с неограниченным buffer. ready/state/heartbeat не создают коллекцию replay. Server проверяет active owner/expiry до enqueue; request abort/ReadableStream cancel отсоединяют только свою streamGeneration. Disconnect не ACK; runtime022 решает grace и drain. Heartbeat/state не продлевают cookie expiry.
