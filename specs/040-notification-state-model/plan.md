# Implementation Plan: модель состояний уведомлений 040

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: последовательный цикл 030–055 и commit/push `refactor` уже поручены; сетевой ACK-контракт сохраняется.

## Summary

Выделить `src/lib/notifications/connection-model.ts`: чистый переход состояния, generation guard, pending ACK-фазу, derivation публичного `{status,canSend,issue}` и единственную команду `publish_recovery`. Контроллер владеет fetch, lease, таймерами, Query и подписчиками, вызывает переходы после подтверждённых событий. UI продолжает получать прежний snapshot и тексты.

## Варианты

[Research](research.md) сравнивает reducer, enum с флагами и state manager. Выбран reducer с discriminated union; он убирает дублируемые canSend/issue и не захватывает сетевой цикл задачи 041.

## Контекст и C1–C8 до проектирования

React 19/Next 16, TypeScript 5.9, Vitest/RTL/Playwright. C1 PASS: варианты/риски представлены. C2 PASS: 040 отдельно от сетевого цикла 041. C3 PASS: полный комплект/read-only перед кодом, пользовательское разрешение действует. C4 PASS: исключение commit/push в refactor. C5 PASS: новых пакетов/БД нет. C6 PASS: fake delivery/credentials. C7 PASS: новый reducer через Red → Green → Refactor, прежний polling baseline перед кодом. C8 PASS: одна модель и projection без framework.

## Модель и контракт

[Data model](data-model.md), [transition contract](contracts/connection-state.md), [quickstart](quickstart.md). Union states: closed (initial/terminal), connecting, connected (`outgoingEnabled`, `pendingAck`), retrying (`pendingAck` сохраняется), limited (busy/unsupported), paused (invalid/not configured). Generation и everConnected общие метаданные, но canSend/issue не хранятся: projection даёт их по variant. `start`, `retry_requested`, `close` синхронны; асинхронные события несут generation и игнорируются при несовпадении/terminal close. `connected` переход выдаёт `publish_recovery` только при восстановлении после первого соединения. ACK фазой управляют `delivery_applied`, `ack_confirmed`, `ack_expired`; контроллер читает pending token и не начинает receive до его очистки.

Контроллер сохраняет один runningTask, abort, lease, settingsReady, failure count, backoff/spacing и вызовы post. Он хранит model и стабильный публичный snapshot для `useSyncExternalStore`; listener вызывается только при изменении snapshot. `NotificationNotice` и `NotificationProvider` не получают новый формат и не переписываются без нужды. Ручной retry инвалидирует generation до ожидания старого task, но не освобождает lease. Auth failure по-прежнему уходит в session cleanup. Серверные маршруты/DTO не меняются.

## Целевые файлы

- Новый `src/lib/notifications/connection-model.ts`; изменить `create-notification-connection.ts` для переходов/selector. Константы/типы обновить только при подтверждённой потребности.
- `tests/unit/notification-connection-model.test.ts` с таблицей переходов/invalid/stale/closed/recovery/ACK/outgoing. `tests/component/notification-notice.test.tsx` — React-проверка существующих текстов/role/retry; `tests/integration/polling-connection.spec.ts` и browser Query/E2E — регрессия эффектов.
- `specs/040-notification-state-model/*`, `docs/refactoring-roadmap.md` после CI.

## Порядок

T001 исходная матрица и baseline → T002 read-only analyze → T003 unit model Red на минимальном stub → T004 чистая модель Green → T005 подключение к контроллеру и targeted polling Green → T006 RTL UI test и targeted Green → T007 полный набор/повторный анализ/refactor → T008 review/commit/push/CI/docs. Новые UI-состояния и правила отправки не добавлять.

## Проверки

`npx vitest run --project node tests/unit/notification-connection-model.test.ts` Red/Green; component Vitest; `npm run test:integration`, `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:query`, `npm run test:e2e`; граф client/server, `git diff --check`, статусы/ACK/recovery и обе CI jobs на head SHA.

## Post-design C1–C8

PASS при указанном ограничении: state вычисляется чисто, только controller исполняет эффекты, публичный snapshot стабилен, таблица проверяет каждую ветку и stale generation. Действий пользователя нет.
