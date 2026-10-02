# Contract: POST /api/chats/history

**Feature**: 018. Node Route Handler читает текущую cookie-сессию. GET/HEAD и
прочие методы не выполняют чтение истории; стандартный 405/OPTIONS Next.js не
объявляется JSON-ответом POST. Внешний GetChatHistory тоже вызывается POST.

## Запрос

Same-origin fetch, credentials: same-origin, cache: no-store,
Content-Type: application/json, обязательный X-Connection-Scope по 014.
Заголовок Origin обязателен: валидный HTTP(S) origin без userinfo/path/query/fragment
должен совпадать с фактическим origin назначения. Назначение строится из Host
и протокола request.url: Next.js нормализует loopback hostname внутри Request.url,
поэтому только этот URL не отражает фактический Host браузера. Неверный Host
отклоняется без fallback; raw Request без Host в unit-тестах использует request.url.
X-Forwarded-* заголовки не задают origin. Отсутствующий Origin, строка null, неверный URL либо чужой
origin дают HTTP 403 `{status:'error',code:'invalid_request'}` без удаления
cookie, чтения body и обращения к поставщику. CORS не включается. Guard
совпадает с 020/023; достаточно минимальной проверки в текущем обработчике,
новый общий модуль ради неё не создаётся. Фиктивные серверные тесты явно
передают корректный Origin для допустимого запроса.
JSON содержит только `{ "chatId": "10000000" }`. Пример фиктивный.
count отсутствует в клиентском контракте: сервер всегда ставит 10. Не принимать
offset/cursor/count, реквизиты или выбранный клиентом provider URL. Shape объекта,
строчный chatId и отсутствующие/лишние поля проверяет
`src/lib/history/validate-history-request.ts`. Общие isChatId/isPersonalChatId
из `src/lib/chats/validate-chat-id.ts`: непустая trimmed строка без управляющих
ASCII; personal дополнительно исключает префикс '-' и суффиксы '@c.us'/'@g.us'.
Структурная совместимость с opaque chatId 014 не доказывает существование либо
принадлежность личному чату. Источники — подтверждённые GetChats user/CheckAccount
и проверка поставщика; normalized history требует chatType: user. Числовой regex,
Number-конверсия, phone alias и произвольный предел длины не вводятся.

Порядок: конфигурация → действующая сессия → форма scope → совпадение вычисленного
scope → same-origin Origin guard → JSON/body → provider. Scope включает expiry существующей cookie и не
заменяет авторизацию. До этих проверок GREEN-API не вызывается. Сессионная
ошибка обрабатывается по 014; неправильный body или чужой scope cookie не удаляет.

## Ответ

HTTP 200, JSON, Cache-Control: no-store:

```typescript
type HistoryResponse = {
  status: 'ok'
  connectionScope: string
  chatId: string
  messages: MessageDTO[]
}
```

Модель — [единый контракт сообщений](../../019-chat-history-window/contracts/message-cache.md).
Нормализованный успешный пустой messages: [] отличается от отсутствия ответа.
Ответ ограничен запрошенным chatId; элементы другого чата/невалидная обязательная
идентичность/направление/время дают invalid_upstream_response, а не чужую переписку.
Не передавать raw body, downloadUrl, thumbnail, senderPhoneNumber, токен, URL
поставщика и неизвестные поля. Для history timestamp обязателен и валиден,
acceptedAt: null; исходящие documented delivered/read распознаются, отсутствие
или неизвестный optional статус не объявляется доставкой. Нетекстовый непустой
typeMessage превращается в kind: unsupported/text: null без медиа-загрузок.
TextMessage сохраняет string textMessage как есть, включая переносы/пробелы.
Чат не добавляется в список только из-за чтения истории.

Ошибка: `{status:'error',code:<нормализованный код>}`, no-store, без текста
поставщика. Применяется таблица [014](../../014-chat-list-query/contracts/chats-api.md):
400 invalid_request, 401 session_required, 409 connection_changed, 429
rate_limited; отдельная клиентская ошибка Origin — 403 invalid_request. Остальные:
502 invalid_upstream_response, 503 server_unavailable,
service_unavailable или retry_later. Нельзя считать любой provider 400 отказом
сессии. Проверенный invalid target/request классифицируется как invalid_request;
неоднозначные состояния сохраняют сессию. Ошибка очистки cookie не выдаётся за
подтверждённое завершение. Только 401 session_required удаляет негодную сессию.

## Provider adapter

`src/lib/green-api/get-chat-history.ts`: fixed HOST из существующего конфига,
encoded id/token из server credentials, JSON `{chatId,count: 10}`, redirect:error,
no-store. caller signal объединяется с общим deadline 10000 ms на fetch/body и
один повтор 429 через 1100 ms. Чтение идемпотентно; повтор ограничен и согласован
технической сверкой с root. До повторного вызова проверяется отмена; клиентский
Query retry: false не умножает попытки. Никаких новых очередей, polling истории
или rate-limit scheduler. Быстрые переключения могут получить 429; ошибка
отличима от пустого успеха, ручной повтор разрешён. Token/raw response не логируются.

Адаптер возвращает нормализованный success/error result и допускает внедрение
fetcher/waitForRetry для детерминированных тестов. Abort после начала provider
не обещает глобальную отмену на стороне Telegram, но результат закрытой области
не публикуется. Запись или изменение сообщений и настроек не выполняются.

## Проверки

Нет сессии/конфига, неверный scope/body/Origin, методы, сообщения другого chatId,
дубликаты, text/media, пустота, неверный JSON/DTO, чужие лишние секретные поля;
401/403/400/429/5xx; 429→успех и 429→429 с ровно двумя вызовами; отмена до
повтора и во время body; no-store и неизменность cookie при временном сбое.
Реальная история не попадает в фикстуры. Серверный Red подтверждён в integration-тестах; actual route E2E проверяет wiring как регрессию после реализации handler. Результаты приведены в verification.md.
