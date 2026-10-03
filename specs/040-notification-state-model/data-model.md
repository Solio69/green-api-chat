# Data model 040

- `ConnectionModel`: discriminated union `closed | connecting | connected | retrying | limited | paused`; общее поколение и факт уже достигнутого connected. `closed.terminal` отличает начальное состояние от закрытого навсегда. `connected/retrying` содержат pending ACK token либо null; другие variants не могут его содержать.
- `ConnectionEvent`: синхронные start/retry_requested/close и подтверждённые асинхронные settings_ready/cycle_succeeded/delivery_applied/ack_confirmed/ack_expired/temporary_failure/limited/paused с generation. Событие другого поколения или для terminal closed не меняет model.
- `ConnectionTransition`: следующий model и набор чистых команд; текущая внешняя команда только `publish_recovery`. Вызов подписчиков, сеть, Query и lease остаются у контроллера.
- `ConnectionState` (публичный snapshot): прежний `{status,canSend,issue}`. Проекция: canSend только connected; issue определяется variant или отключёнными outgoing status webhooks. Snapshot хранится контроллером стабильной ссылкой до значимого изменения.
- `PendingAck`: token связывает applied delivery с ACK. Временный сбой его сохраняет; confirmed/expired/manual retry/close очищают. При token не вызывается новый receive.

Реальная история сообщений и серверная очередь не меняются.
