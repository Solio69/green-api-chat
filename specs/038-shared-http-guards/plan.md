# Implementation Plan: общие HTTP-проверки 038

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03.
**Авторизация**: пользователь поручил последовательное завершение 030–055 с commit/push `refactor`; новые продуктовые требования не вводятся.

## Summary

Извлечь точное совпадение Origin/Host, чтение scope, JSON media type, ограниченный и неограниченный JSON reader, JSON no-store response в `src/server/http`. Обработчики сохраняют свой порядок guard-проверок и преобразование ошибок. Отправка сохраняет 65 536 и 413 с `not_sent/unknown`; уведомления — 8 192 и 400; history/recipient не получают нового лимита.

## Рассмотренные варианты

См. [research.md](research.md): низкоуровневые функции вместо общего middleware/pipeline. Единый pipeline переставил бы проверки с уже заданным приоритетом ошибок, потому не выбран. Сохранение только общих констант не убрало бы повторяющийся код.

## Контекст

Next.js 16.3.7/TypeScript 5.9.3, Node 24, стандартные Request/Response/ReadableStream/TextDecoder; новых пакетов нет. Исходные договорённости, тесты и таблица маршрутов в research. Серверный слой не импортируется клиентом.

## Конституция C1–C8 до проектирования

C1 PASS: варианты/риски показаны. C2 PASS: 038 только HTTP guards, session 037 и transport 039 отдельно. C3 PASS: spec/полный комплект/read-only анализ до кода, разрешение сохранено. C4 PASS: пользовательское исключение commit/push `refactor`. C5 PASS: нет установки/БД. C6 PASS: только фиктивные данные. C7 PASS: новый API bounded reader через Red → Green → Refactor; исходные handlers матрицей до/после. C8 PASS: функций ровно столько, сколько нужно нескольким потребителям.

## Дизайн

[Модель](data-model.md), [контракт](contracts/http-guards.md), [матрица](research.md), [quickstart](quickstart.md).

`isSameOrigin(request)` повторяет фактический Host-over-URL при наличии, отклоняет malformed Host, credentials/path/query/fragment и non-HTTP(S). Используется только send/history/notifications. `readConnectionScope(request)` возвращает string или null по существующему `SCOPE_PATTERN`; сравнение со значением контекста и код ответа остаются у handler. `isJsonMediaType(request)` применяет прежнюю нормализацию. `readBoundedJsonBody({request,maxBytes,contentLengthPolicy})` возвращает tagged union `ok | invalid_media_type | invalid_body | too_large`, считает фактические bytes, fatal UTF-8, отменяет reader при ошибке/переполнении и освобождает lock. `contentLengthPolicy=ignore` у send, `reject_invalid_or_excess` у notifications; последнее отображает отказ в прежний 400 даже при `too_large`. `readUnboundedJsonBody(request)` вызывает `request.json()` с catch и не вводит лимит; media check вызывают только маршруты, где она уже была. `jsonNoStore({body,status})` формирует Response.json с существующим `Cache-Control: no-store`; body/status каждый handler строит сам.

Тонкий compatibility wrapper `src/lib/sending/read-send-body.ts` сохраняет старый экспорт и mapping `ok/invalid_request/too_large`, поскольку на него опираются текущие тесты и будущая миграция 039. Удаление wrapper относится к 054, если после 039 он не нужен. Notification `readBody` заменяется на shared reader; history/recipient — на unbounded reader, auth/login — только `isJsonMediaType` и `jsonNoStore`. Chats/другие no-store handlers используют общий response helper. Не менять таймауты, AbortSignal, DTO валидацию и provider error mapping.

## Целевые файлы

- Новые `src/server/http/{constants.ts,is-same-origin.ts,read-connection-scope.ts,is-json-media-type.ts,read-json-body.ts,json-no-store.ts,index.ts}`; Origin/Host-константы живут рядом с общим guard.
- Изменить `src/lib/sending/{constants.ts,read-send-body.ts,handle-send-request.ts}`, `src/lib/history/{constants.ts,handle-history-request.ts}`, `src/lib/notifications/handle-notification-request.ts`, `src/lib/chats/handle-chats-request.ts`, `src/lib/recipients/{handle-search-request.ts,resolve-search.ts}` и `src/features/auth/server/handle-login-request.ts` только в перечисленных guards/response adapters; устаревшие локальные Origin/Host-константы удалить.
- `tests/unit/http-guards.test.ts`: новый TDD-контракт body/Origin/scope/response. `tests/integration/shared-http-contract.spec.ts`: матрица старого и нового пути по публичным кодам/телам; существующие integration и E2E остаются.
- `specs/038-shared-http-guards/*`, `docs/refactoring-roadmap.md`: verification и статус после CI.

## Последовательность и TDD

T001 baseline research/matrix → T002 полный комплект и read-only analyze → T003 integration matrix на существующих handlers, Passed baseline → T004 unit tests нового shared API и поведенческий Red через минимальный public stub (import failure не считается) → T005 shared guards/reader Green → T006 перенос handlers/wrappers без изменения порядка и интеграционный Green → T007 refactor/review/full checks → T008 commit/push/CI и итоговая документация. Зависимости строгие; тесты не считаются подтверждением TDD, если написаны после кода.

## Проверка

`npx vitest run --project node tests/unit/http-guards.test.ts` Red/Green; `npm run test:integration` до/после, особенно send/history/notification/recipient/login/chats; `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:query`, `npm run test:e2e` (production build), `git diff --check`. Прямой review порядка проверок и соответствия матрице, отсутствие новых Origin/limiting policies и client→server import. Обе GitHub Actions jobs на фактическом head SHA после push.

## Post-design C1–C8 и сложность

C1–C8 PASS при описанных границах. Параметр Content-Length нужен только из-за реально различающихся контрактов, а не как общее расширение; no-store helper не скрывает status/body. Операторских действий нет.
