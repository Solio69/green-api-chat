# Contract: POST /api/auth/login

## Запрос

- Same-origin HTTPS в production; локально HTTP только для разработки.
- Заголовок `Content-Type: application/json`.
- Тело: JSON-объект `{"idInstance":"<строка>","apiTokenInstance":"<строка>"}`.
- Оба значения обязательны; пробельные строки считаются пустыми. Значение токена не обрезается и не преобразуется. Ввод не может управлять API-хостом или именем метода.
- Сервер принимает тело не более 8 КБ и ждёт GREEN-API не более 10 секунд суммарно на проверку, включая единственный повтор после HTTP 429. При неверном формате или превышении лимита запрос не уходит к провайдеру.

## Ответ

Каждый ответ содержит `Cache-Control: no-store`. Ответ не содержит ID, токен, URL с токеном или полный текст ошибки провайдера.

| Сценарий | HTTP | JSON | Cookie |
| --- | --- | --- | --- |
| `authorized` | 200 | `{"status":"ok"}` | Установлена зашифрованная HttpOnly-cookie на 24 часа |
| Неверный формат/пустые поля | 400 | `{"status":"error","code":"invalid_request"}` | Не создаётся |
| GREEN-API 401 | 401 | `{"status":"error","code":"invalid_token"}` | Не создаётся |
| GREEN-API 403 | 401 | `{"status":"error","code":"invalid_instance"}` | Не создаётся |
| `notAuthorized` / `pendingPassword` | 409 | `{"status":"error","code":"needs_authorization","stateInstance":"..."}` | Не создаётся |
| `blocked` / `suspended` | 409 | `{"status":"error","code":"instance_restricted","stateInstance":"..."}` | Не создаётся |
| `starting`, 400 `instance in starting process try later` либо неоднозначный 400 `instance is starting or not authorized` | 503 | `{"status":"error","code":"retry_later"}` | Не создаётся |
| Известный 400 об истечении инстанса | 409 | `{"status":"error","code":"instance_expired"}` | Не создаётся |
| Повторный HTTP 429 после паузы 1,1 секунды | 429 | `{"status":"error","code":"rate_limited"}` | Не создаётся |
| Таймаут, сбой сети, 5xx провайдера | 503 | `{"status":"error","code":"service_unavailable"}` | Не создаётся |
| Неизвестный статус, неизвестное состояние или некорректное тело | 502 | `{"status":"error","code":"invalid_upstream_response"}` | Не создаётся |
| Отсутствует серверный секрет сессии | 503 | `{"status":"error","code":"server_unavailable"}` | Не создаётся |

Неоднозначный 400 `instance is starting or not authorized` сам по себе не подтверждает потерю доступа: форма предлагает повторить проверку и при необходимости открыть кабинет, действующая сессия сохраняется. Остальные непредусмотренные 400 не получают успешный исход и показывают безопасную общую ошибку.

## UI-контракт

Форма остаётся на `/login` при любой ошибке; русское сообщение выводится возле формы, для `invalid_token`/`invalid_instance` — с указанием соответствующего поля. Ссылка на кабинет доступна при `needs_authorization`, `instance_restricted` и `instance_expired`. При `retry_later`, `rate_limited` и `service_unavailable` предлагается повторить попытку; ссылка на кабинет остаётся доступной как общая подсказка формы. Введённые значения сохраняются; параллельный повторный POST заблокирован на время ожидания.

При 200 клиент выполняет переход на `/`. Наличие успешного ответа нашего API не заменяет серверную проверку защищённой страницы.
