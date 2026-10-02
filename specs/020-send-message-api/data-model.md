# Data model: отправка через сервер

**Статус**: независимое серверное ядро реализовано; БД отсутствует, HTTP интеграция ожидает022/023.

| Сущность        | Поля                                                              | Принадлежность                                   |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| SendRequest     | chatId:string, message:string, attemptId:UUID string              | Одна явная попытка браузера                      |
| Request binding | connectionScope:string, ownerCapability:string                    | Заголовки + HttpOnly-cookie; capability из 023   |
| AcceptedSend    | status:'ok', connectionScope, chatId, attemptId, idMessage:string | Подтверждение API, без timestamp/delivery        |
| SendFailure     | status:'error', code, outcome:'not_sent'\|'unknown'               | Без сырого ответа, реквизитов и текста сообщения |
| Send lease      | capability/instance/scope/attemptId + idempotent release          | Runtime 022; живёт до локального settlement      |

chatId не преобразуется в число; используется общий src/lib/chats/validate-chat-id.ts
isPersonalChatId из 018. isChatId проверяет непустую trimmed строку без control
characters; personal дополнительно отвергает leading '-' и suffix @c.us/@g.us.
Это структурная проверка, не доказательство существования: источник выбора —
GetChats(type:user) или CheckAccount. Opaque контракт 014 не ужесточается numeric
regex; фиктивный chat-1 в тестах не объявляется фактическим Telegram id.
idMessage остаётся строкой и не заменяется attemptId или receiptId.

Содержимое message — исходная строка. Локальная проверка: trim().length > 0,
Array.from(message).length <= 4096. Подсчёт — code points, не утверждение о
внутреннем алгоритме поставщика. JSON имеет максимум 65536 байт UTF-8 по
фактическому потоку, а не доверенному Content-Length.

Переходы попытки: validation/auth/owner отказ → not_sent;
dispatch → confirmed idMessage либо подтверждённый отказ либо unknown.
Поздний HTTP-ответ помечен исходными attemptId/scope/chatId; cookie браузера,
изменившаяся во время ожидания, не переносит его на другое подключение.
Статусы delivered/read/failed/noAccount в AcceptedSend отсутствуют: источник 024.

Замок — временная локальная сериализация, а не таблица отправок. Нет журнала
идемпотентности и подавления одинаковых ручных повторов после settlement.
