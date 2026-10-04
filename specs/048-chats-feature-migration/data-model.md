# Data Model 048: список чатов

| Сущность | Владелец | Инвариант |
| --- | --- | --- |
| `PersonalChat` | chats/model | `chatId`, `name`, `username`, `phone`; nullable display fields; provider order и unique `chatId` |
| Provider payload | chats/server и `lib/green-api/get-chats` | `unknown` до нормализации; credentials/DTO не передаются клиенту |
| `SessionChatCache` | chats/application | facts/labels по chatId внутри одного QuerySession; pending после пустого/ошибочного provider list |
| Query result | chats/application | ключ `[chats, connectionScope]`, прежние stale/gc/retry/refetch; при закрытии scope данные недоступны |
| List presentation | chats/ui | готовые записи, выбранный chatId, unread counts, labels и actions; `99+` визуально, точное число ARIA |

Источники данных и порядок объединения не меняются. Повторная доставка и подтверждение provider не создают второй chatId. Данные живут в памяти подключения, не в БД/storage.
