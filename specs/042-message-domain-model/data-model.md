# Data Model 042: message facts

| Сущность | Поля/источник | Инвариант |
| --- | --- | --- |
| MessageDTO | chatId, idMessage, direction, kind/text, timestamp, acceptedAt, status; нормализованный HTTP/история/уведомление | Не содержит raw provider body или секреты; внешний `unknown` проверяется до использования. |
| MessageFact | `{message: MessageDTO, source: history/live/accepted}`; валидированный вход чистого merge | Источник относится к конкретному сообщению; validation не мутирует DTO. |
| MessageView | Отображаемые поля после merge, без внутреннего source | Один `(chatId,idMessage)`, прежние приоритеты содержимого/времени/статуса. |
| Content provenance | Record составной identity → source | Даже одинаковые idMessage разных чатов не смешивают accepted/live/history. |
| Early status | status fact, observedAt, sequence, issues | Identity составной; TTL 300000 ms, лимит 1000, duplicate не продлевает TTL. |
| Conflict issue | chatId, idMessage, failed/noAccount | Публикуется при противоречии с подтверждённым статусом, не превращает его в отказ. |

Составной identity — JSON пары `[chatId,idMessage]`, сохраняет однозначность строк без ручного разделителя. Данные остаются в памяти Query-сеанса; на диск не пишутся. Формы JSON API и UI не меняются.
