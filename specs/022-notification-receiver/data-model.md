# Модель серверного получателя

**Хранилище**: память одного Node-процесса; постоянных таблиц/миграций нет.

| Сущность          | Поля и границы                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| ProviderQueueKey  | Проверенный idInstance; scope/token не создают новый ключ                                                             |
| Owner             | connectionScope, expiresAt, server credentials, opaque capability, epoch, streamGeneration, attached/grace/revoked    |
| PendingDelivery   | Один receiptId server-side, opaque deliveryId, normalizedEvent, browserProcessed, deleteAttempts; связь с epoch/scope |
| InflightOperation | Один Receive/Delete, отдельный максимум один Send; локальные promises и abort controllers; drain до handover          |
| ReceiverState     | idle/receiving/awaiting_ack/deleting/recovering_delete/retrying/paused; safe stage/code, без raw body                 |

Нет массива истории/очереди replay в registry. Pending event и credentials не переживают удаление entry/процесса. Owner expired/released не получает новые события и не разрешает операции; in-flight settle не оживляет старый entry. При отсутствии subscribers receive остановлен, не создаётся фоновая session только ради очереди. Grace и cookie expiry реализуются timer cleanup и повторной проверкой перед эффектом.

Переходы/guards/границы повторов: [receiver-runtime](contracts/receiver-runtime.md). Normalized client DTO: [normalization](contracts/notification-normalization.md). Message fact identity и кеш принадлежат 019, registry не хранит полную переписку. Выход от другого scope того же инстанса не отбирает текущий owner.

Owner reservation содержит preflight state и исходящие configuration flags, но не raw настройки; при ошибке проверки не публикуется capability и entry drain/cleanup завершается.
