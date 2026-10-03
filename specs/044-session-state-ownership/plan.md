# Implementation Plan: владение памятью подключения 044

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: полный цикл 030–055 и commit/push `refactor` уже поручены.

## Summary

Очистить `src/lib/query/create-query-session.ts` от chat/memory импорта и метода `options()`, сохранив QueryClient, scope, error/close, retain и cleanup. Создать `chatsQueryOptions(session)` в chats, `configureConnectionMemory(client)` и `createConnectionSession` в conversations. QueryProvider использует composition factory. `useChats` и notification refresh используют chat options; прямые тесты перестают ожидать feature defaults от generic core. Ключи, сроки, unread/selection и UI поведение прежние.

## Основание и C1–C8 до проектирования

[Research](research.md) сравнивает три варианта. C1 PASS: граница/риск объяснены. C2 PASS: 044 ограничена ownership/lifecycle, не UI 048/049 и не fixture cleanup 050. C3 PASS: авторизация полного цикла есть. C4 PASS: разрешение commit/push `refactor` есть. C5 PASS: зависимостей/БД нет. C6 PASS: фиктивные scope и данные. C7 PASS: 043 baseline зелёный; чистый перенос опирается на baseline, новые контрактные проверки разделения владельцев добавляются до финального запуска, без искусственного Red. C8 PASS: сохраняем TanStack Query и существующие stores.

## Модель и контракт

[Data model](data-model.md), [session ownership contract](contracts/session-ownership.md), [quickstart](quickstart.md). `createQuerySession` не знает feature modules. Memory defaults конфигурируются в одном composition path и там, где тест намеренно создаёт полноценное подключение. `chatsQueryOptions` возвращает существующие значения и queryFn. Close отменяет все запросы и очищает кеш; те же resource callbacks сохраняют изоляцию ошибок. Query keys и видимость unchanged.

## Файлы и порядок

- Изменить `src/lib/query/create-query-session.ts`: удалить feature imports, config loop и chat `options()`, сохранить generic lifecycle/тип.
- Новый `src/lib/chats/chats-query-options.ts`; изменить `src/lib/chats/use-chats.ts`, `src/lib/notifications/refresh-notification-chats.ts`.
- Новые `src/lib/conversations/configure-connection-memory.ts`, `create-connection-session.ts`; изменить `src/components/QueryProvider/QueryProvider.tsx`.
- Обновить только тесты, использовавшие `session.options()` или ожидавшие memory defaults у generic core: `tests/integration/chat-query.spec.ts`, `session-chat-facts.spec.ts`, `history-query.spec.ts` и др. по фактическому grep; проверить `tests/component/provider-lifecycle.test.tsx` и unread Query/Playwright.
- Документы `specs/044-session-state-ownership/*`, roadmap после CI.

## Проверки

Baseline 043: 58/366/46/110 и зелёный CI на SHA после завершения. Targeted baseline для chat/session memory/cleanup подтверждается перед кодом. Чистый перенос без нового продуктового поведения; новый тест разделения generic и composition фиксирует отсутствие defaults в core и точные defaults при composition. Проверить scoped keys, GC/stale, close/late responses, duplicate seen, hidden panel, StrictMode. После Refactor: typecheck/lint/styles/format, Vitest, integration, Query, E2E последовательно для Playwright; граф импортов, diff/секреты, CI обеих jobs на SHA кода и итоговых документов.

## Post-design C1–C8

PASS при неизменных ключах/политиках, явном владельце настройки и отсутствии нового store. Отступлений от конституции и действий пользователя нет.

## Complexity Tracking

Два маленьких composition/config файла нужны, чтобы shared Query не импортировал функции переписки; сохранение старого метода `options()` скрыло бы границу, поэтому его потребители обновляются явно.
