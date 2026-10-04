# Research 039: контракт действующих адаптеров GREEN-API

Дата: 2026-10-03. Основание: `src/lib/green-api/*`, integration-наборы методов и спецификация 039. Цель — выделить общий транспорт без изменения предметной классификации.

| Операция | Метод и тело | Signal/deadline | Повтор 429 | Обработка ответа |
| --- | --- | --- | --- | --- |
| GetStateInstance | GET | 10 с; собственного caller signal нет | Один повтор после 1 100 мс; тело 429 не отменяется | 400 через `classifyBadRequest`; 401/403 отдельные; JSON state |
| GetAccountSettings | GET | 10 с; собственного caller signal нет | Один повтор после 1 100 мс; тело 429 не отменяется | Как state плюс нормализация profile |
| GetChats | GET | 10 с, объединён с caller signal | Один повтор после cancel тела 429 и 1 100 мс; проверки abort до/после | Safe DTO списка |
| GetChatHistory | POST JSON `{chatId,count:10}` | 10 с, объединён с caller signal | Один повтор после cancel тела 429 и 1 100 мс; проверки abort до/после | Bad target, safe DTO истории |
| CheckAccount | POST JSON query | 10 с | Нет; 429 и 469 дают rate_limited | Safe recipient result |
| SendMessage | POST JSON `{chatId,message}` | caller abort только до dispatch; затем отдельный 10 с deadline | Нет никогда | 401/403/429 раздельно; после dispatch неоднозначность → outcome_unknown |
| Notification settings/receive/delete | GET/GET/DELETE, suffix polling/receipt | 8 с, объединён с caller signal где есть | Нет; Retry-After секунды/дата превращаются в retryAfterMs | Общий notificationRequest классифицирует HTTP, JSON/пустой ответ; Delete false остаётся boolean |

У всех существующих вызовов фиксированный host, URL с `encodeURIComponent` обеих частей credentials, `cache:no-store`, `redirect:error`, внедряемый fetch. Тела провайдера анализируются только в адаптерах; сырые URL с токеном не логируются. Транспорт не должен владеть retry, ожиданием, классификацией, timeout или caller cancellation. Все операции уже подают готовый signal; SendMessage создаёт deadline лишь после `callerSignal.throwIfAborted()` и не связывает его с caller signal.

| Вариант | Плюсы | Риск/цена | Выбор |
| --- | --- | --- | --- |
| Малый `fetchGreenApi` с кодированием URL и единым RequestInit; policy остаётся у операции | Устраняет повтор без изменения разной семантики; минимальный diff | Адаптеры всё ещё содержат собственные retry/response ветки — это их контракт | Выбран |
| Универсальный client с retry, timeout, JSON и error mapping | Короткие адаптеры | Скрывает момент dispatch и сделает SendMessage повторяемой/отменяемой; меняет ошибки | Отклонён |
| Только общий URL builder | Самый малый риск | Семь копий no-store/redirect/fetch остаются | Отклонён |

Существующие тесты по методу покрывают URL, кодирование, headers, статус, abort, retries и ошибки. Новая unit-проверка транспорта подтверждает общий вызов и отсутствие собственной политики; матрица regression остаётся независимой. Новых пакетов нет.
