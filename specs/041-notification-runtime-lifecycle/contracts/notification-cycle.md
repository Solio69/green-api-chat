# Контракт notification cycle 041

## Ports

`runNotificationCycle({ generation, owner, signal, active, post, wait, random, pendingAck, transition, applyDelivery, handleFailure })` — асинхронный однопоточный цикл для уже приобретённого lease. `post` принимает `{url,body,signal}` и возвращает проверенный транспортом JSON record. `wait({delay,signal})` завершается при abort. `active()` после каждого await подтверждает ту же сессию, поколение и сигнал. `pendingAck()` возвращает token модели 040. `transition(event)` синхронно применяет событие к модели и исполняет recovery command. `applyDelivery(delivery)` применяет валидное событие к cache и возвращает boolean; false классифицируется как invalid upstream. `handleFailure(error)` завершает цикл для auth, unavailable lock и invalid/not configured или возвращает false для временной ошибки.

## Sequence

1. Без settingsReady выполнить settings, проверить active и `outgoingEnabled:boolean`, перейти settings_ready.
2. При `pendingAck() === null` выполнить receive, проверить active и response; доставка проверяется по типу/scope/ownerEpoch/proof, применяется до `delivery_applied`. Пустая очередь не создаёт proof.
3. При pending proof выполнить ACK, проверить active и совпадение deliveryId; затем `ack_confirmed`.
4. Сбросить failures, отправить `cycle_succeeded`, ждать `REQUEST_SPACING_MS` с тем же signal. Два receive никогда не выполняются одновременно.
5. На `delivery_changed` при pending proof отправить `ack_expired` и без ACK повторить receive. Иной terminal error передать `handleFailure`; temporary error отправить `temporary_failure`, ждать `max(jitteredBackoff, retryAfterMs)`.

Если active стал false, цикл завершает работу без transition, apply и ACK. Runtime не приобретает и не освобождает Web Lock, не создаёт React-подписки и не меняет серверный контракт.

## Production timing

`RECEIVE_TIMEOUT_SECONDS=5` задаётся серверной операцией; notification/provider deadline 8 s и client timeout 25 s остаются. `REQUEST_SPACING_MS=100`, backoff [1000,2000,4000,8000,10000] ms, jitter 0.8–1.0, Retry-After минимум задержки. Default `now=Date.now`, `random=Math.random`, `wait=waitForNotificationRetry`. Инъекции используются в тестах и не меняют публичные значения.
