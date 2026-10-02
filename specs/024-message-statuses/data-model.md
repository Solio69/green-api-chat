# Модель статусов

| Факт                 | Область и хранение                                                                   |
| -------------------- | ------------------------------------------------------------------------------------ |
| Acceptance           | idMessage из успешного Send020/021, local acceptedAt; не delivery                    |
| ProviderStatusFact   | Нормализованный enum/identity, provider timestamp в секундах или null; scope снаружи |
| MessageStatusFact019 | Полная chat/id identity и enum для applyMessageFacts, без текста                     |
| Materialized status  | Поле outgoing MessageDTO019, подтверждение сохраняется до scope close                |
| EarlyStatusFact      | Ключ scope/chat/id, observedAt/sequence, TTL 300000 ms/max1000/lazy prune            |
| General issue        | Latest safe code соответствующего чата либо подключения, не случайного сообщения     |

Типы и Query keys принадлежат 019; server normalizer022 валидирует provider по spec024,023 передаёт полную identity в applyMessageFacts и публикует result.019 owns merge-message-facts.ts и message-status-issues.ts;024 читает status/issue для отображения. Другой постоянный или браузерный store не создаётся.

TTL ограничивает только ранние факты без реального сообщения; materialized status и сообщения остаются до завершения scope. Поздний callback после close не применяется к новому подключению. Failure без idMessage не сопоставляется по тексту/последней попытке. [Переходы и helper](contracts/message-statuses.md), [общая модель 019](../019-chat-history-window/contracts/message-cache.md).
