# Research: единый серверный контекст 037

Дата: 2026-10-03. Источники: текущий код/тесты проекта, [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [iron-session API](https://github.com/vvo/iron-session#api).

## Исходные факты

- Сейчас `src/app/api/chats/route.ts`, `chats/history/route.ts`, `recipients/search/route.ts`, `app/page.tsx` и `src/lib/notifications/request-context.ts` отдельно читают cookie, env, реквизиты и scope. `messages/route.ts` импортирует notification context только ради сессии.
- `openSession`, `saveCredentials`, `readCredentials` находятся в `src/lib/auth/session.ts`; политика cookie уже проверена integration tests и остаётся 24 часа с HttpOnly/SameSite Lax/Secure в production. `getQueryScope` — HMAC от connection identity и срока.
- `cookies()` в Next.js 16 асинхронна; чтение допустимо в Server Component, запись/удаление — в Route Handler или Server Function. Значит функция чтения не должна вызывать `delete`/`save`.
- iron-session 9 допускает `getIronSession(cookieStore, options)` и требует `save()` только при записи. Чтение не продлевает абсолютный срок в payload; это уже закреплено тестом.

## Варианты

| Вариант | Плюс | Цена и риск | Решение |
| --- | --- | --- | --- |
| Один общий `readRequestSession` с переданным cookie store; тонкие page/route adapters | Один источник проверки, отдельная route-only способность удаления, удобно тестировать два независимых store | Дополнительный слой adapter; публичный контракт результата требует тестов | Выбран: соответствует FR-001–FR-006 и правилам Next |
| Только общий hook вокруг `cookies()` для всех потребителей | Меньше файлов | Page может случайно получить write capability; зависимость от Next мешает проверке изоляции | Не выбран |
| Оставить notification context общим для messages и остальных | Меньше миграция | Зависимость отправки от notifications и повторение сохраняются | Не выбран |

`readRequestSession` возвращает tagged union `unconfigured` / `missing` / `authorized`. `readPageSession` предоставляет только чтение. `readRouteSession` дополняет результат `clearSession`, привязанный к store данного вызова. Секрет для ACK получает только notification adapter из env; общий результат не содержит пароль. Повторный cookie write при чтении исключён.

## Границы решения

Никаких новых пакетов, БД, global cache, внешних запросов, смены cookie/TTL/status/redirect. `login` продолжает `openSession`/`saveCredentials`; `logout` и `end-session` только удаляют cookie. Специальные ошибки и response headers остаются в существующих handlers; 038 будет общей HTTP guard-логикой.
