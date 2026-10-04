# Implementation Plan: разделение сетевого цикла и жизненного цикла уведомлений 041

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: последовательный полный цикл 030–055 и commit/push `refactor` уже поручены; изменения поведения и HTTP-контрактов не планируются.

## Summary

Вынести последовательный settings → receive → apply → ACK → wait/retry loop в `src/lib/notifications/run-notification-cycle.ts`. Оставить `create-notification-connection.ts` владельцем модели 040, Web Lock, owner epoch, runningTask, abort, retain/close/retry и React-подписчиков. В `notification-transport.ts` и `refresh-notification-chats.ts` передать опциональный `now`, а контроллеру дать опциональные `post`, `wait`, `random`, `now` для детерминированных тестов. Production defaults сохраняют нынешние значения и сроки.

## Основание и C1–C8 до проектирования

[Research](research.md) описывает исходный контракт и сравнение трёх вариантов. C1 PASS: причины и цена решения представлены. C2 PASS: 041 не переписывает модель 040 или кеш 043. C3 PASS: согласование всех задач и разрешение реализации сохранены. C4 PASS: пользовательское исключение commit/push в refactor. C5 PASS: пакеты/БД/серверные методы не меняются. C6 PASS: только фиктивные реквизиты. C7 PASS: чистый перенос опирается на baseline 15 polling и 8 lifecycle, новая точка инъекции проверяется Red → Green. C8 PASS: один новый модуль для фактического цикла без framework.

## Устройство

[Data model](data-model.md), [runtime contract](contracts/notification-cycle.md), [quickstart](quickstart.md). `runNotificationCycle` принимает сигнал, поколение, действующий owner, `active()`, post, wait, random, selector pending ACK и callbacks для `transition`, применения доставки, классификации failure. Он владеет только локальными settingsReady/failure count и циклом; не владеет lease или React-подписками. После каждого await проверяет active; до ACK проверяет структуру delivery/proof и результат применения. На ошибке ACK `delivery_changed` очищает proof и продолжает receive, временный сбой сохраняет proof, terminal/auth/invalid передаются контроллеру. Backoff и spacing неизменны.

Контроллер сначала acquires lease; если закрыт до его выдачи — сразу release, без сети. После lease создаёт owner epoch и вызывает runNotificationCycle. `close()` инвалидирует модель, abort, освобождает lease и закрывает refresh. `retry()` инвалидирует поколение и ждёт runningTask, затем start; lease сохраняется. Публичный snapshot, `captureOwnerContext` и `getOwnedHeaders` не меняются. `NotificationProvider` остаётся без правок, так как его StrictMode retain/release и подписки уже проверяются; при необходимости исправления фактического расхождения добавляется отдельный регрессионный тест перед кодом.

Опциональные dependencies: `post` того же контракта, что `createNotificationTransport`, `wait` того же контракта, что `waitForNotificationRetry`, `random: () => number`, `now: () => number`. Default transport создаётся с `now`; throttled refresh также получает `now`. Следовательно HTTP-date Retry-After и обновление списка воспроизводимы; время production не меняется. Не вводить скрытые допуски к отсутствующему Web Lock.

## Файлы и порядок

- Новый `src/lib/notifications/run-notification-cycle.ts`; изменить `create-notification-connection.ts`, `notification-transport.ts`, `refresh-notification-chats.ts` для ports/разделения. `browser-tab-lease.ts` сохраняется, если анализ не выявит дефекта.
- Новые `tests/unit/notification-cycle.test.ts` для deterministic wait/backoff/ACK/late response (минимальный stub и поведенческий Red), `tests/unit/notification-transport-time.test.ts` для HTTP-date Retry-After (Red/Green) и `tests/unit/notification-chat-refresh.test.ts` для ограниченного обновления списка; расширить `tests/integration/polling-connection.spec.ts` для deadline/lease/close границ только по пробелам покрытия. Существующие `tests/component/provider-lifecycle.test.tsx`, browser Web Locks Query и E2E — регрессия.
- Документы `specs/041-notification-runtime-lifecycle/*`, roadmap после CI.

T001 baseline/контракт → T002 read-only analyze → T003 тесты новой управляемой зависимости и подтверждённый Red → T004 Green run-loop/ports → T005 controller integration/refactor и targeted tests → T006 полный набор/повторный анализ/review → T007 commit/push/CI/docs. Проверить повторный receive, ACK, Retry-After, settings/receive/ACK close и late lock.

## Проверки

`npx vitest run --project node tests/unit/notification-cycle.test.ts` Red/Green; targeted `npm run test:integration -- tests/integration/polling-connection.spec.ts`; `npx vitest run --project dom tests/component/provider-lifecycle.test.tsx`; полный `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e` последовательно для Playwright; client/server graph, `git diff --check`, обе CI jobs на head SHA. Реальные credentials/очереди не используются.

## Post-design C1–C8

PASS при указанных границах: модель 040 остаётся единственным источником статуса/ACK, runtime исполняет последовательную сеть, controller владеет ресурсами, production defaults идентичны исходным; новые инъекции служат проверяемости, не продуктовой настройке. Пользовательских действий нет.
