# Contract: connection model 040

```ts
initialConnectionModel: ConnectionModel
transitionConnection(model, event): { model: ConnectionModel; commands: readonly ConnectionCommand[] }
toConnectionState(model): ConnectionState
pendingAckToken(model): string | null
```

Таблица событий:

| Событие | Допустимый исход |
| --- | --- |
| start | initial/restartable → connecting; terminal close no-op |
| retry_requested | generation++, pending ACK сброшен, старый run инвалидирован; terminal no-op |
| close | generation++, terminal closed, ACK сброшен; повторный close no-op |
| settings_ready | connected с текущим outgoingEnabled; recovery только после прежнего connected |
| delivery_applied | установить pending token; status остаётся connected/retrying |
| ack_confirmed/ack_expired | очистить только текущий pending token; expired разрешает новый receive |
| temporary_failure | retrying, canSend false, pending token сохранён |
| cycle_succeeded | connected; recovery один раз при восстановлении |
| limited/paused | соответствующий issue; canSend false; ACK сброшен |

Асинхронное событие с неверным generation или после terminal close no-op без команд. Неверный переход не создаёт эффект. `toConnectionState` возвращает те же строки и тексты причин, что текущий публичный контроллер; `canSend` при connected остаётся true даже с pending ACK и `outgoing_notifications_disabled`. Контроллер не запрашивает receive при непустом `pendingAckToken`.
