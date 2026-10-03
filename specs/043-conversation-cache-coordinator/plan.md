# Implementation Plan: координатор кеша переписки 043

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: полный последовательный цикл 030–055 и commit/push `refactor` уже поручены.

## Summary

Вынести синхронное применение истории, принятой отправки и notification delivery в `src/lib/conversations/conversation-cache-coordinator.ts`. История применяется один раз внутри `queryFn` после проверенного fetch и перед возвратом результата Query. Hook оставляет request/read/refetch state, удаляет собственную QueryCache-подписку и `dataUpdateCount`. Отдельные send и notification adapters вызывают координатор; cache helpers остаются узкими, модель merge 042 не переписывается. HTTP и UI контракт сохраняются.

## Основание и C1–C8 до проектирования

[Research](research.md) содержит факты и три варианта. C1 PASS: решение и риск зафиксированы. C2 PASS: 043 — application orchestration, не 042 domain merge и не 049 UI. C3 PASS: поручение пользователя покрывает реализацию. C4 PASS: отдельное разрешение commit/push в refactor. C5 PASS: пакетов/БД/нового API нет. C6 PASS: фиктивные данные. C7 PASS: baseline 29/29, новое исключение повторного apply через Red → Green; остальное — сохраняемый контракт. C8 PASS: один координатор и совместимые adapters без нового state framework.

## Модель и контракт

[Data model](data-model.md), [contract](contracts/conversation-cache.md), [quickstart](quickstart.md). Query выполняет один queryFn на общий key. Перед записью после await проверяются signal и session; отмена Query по старому ключу защищает смену accessId. Синхронные cache-записи внутри `notifyManager.batch` объединяют уведомления подписчиков; входные факты проходят preflight. ACK остаётся после return. `accessId` сохраняется в requestKey, разница loading/empty/error и retention — в Query/read model. Канонический merge 042 остаётся чистым.

## Файлы и порядок

- Новый `src/lib/conversations/conversation-cache-coordinator.ts`: history fetch/apply, accepted, delivery commands и preflight.
- Изменить `src/lib/history/use-chat-history.ts`: убрать `useLayoutEffect`/QueryCache-подписку, поместить apply в queryFn; сохранить query key/state/refetch.
- Изменить `src/lib/notifications/apply-notification.ts`, `src/lib/sending/create-send-controller.ts`: делегировать координатору без дублирующих cache writes; `message-cache.ts` оставить совместимым adapter.
- Тесты: `tests/query/history-query.spec.ts` и fixture HistoryProbe для одного применения при нескольких читателях; `tests/integration/conversation-cache-coordinator.spec.ts` для controlled fetch, competing live/history, accepted/delivery/ACK/scope/invalid. Существующие integration/query/E2E — регрессия.
- Документы `specs/043-conversation-cache-coordinator/*`, roadmap после CI.

## Проверки

Baseline 29/29 integration; targeted Query на текущем коде до правок. Сначала новый браузерный тест `one request → one message-cache write` на двух+ потребителях: текущая подписка должна дать поведенческий Red. Затем Green и test matrix с управляемыми завершениями. После Refactor: `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e`; Playwright последовательно. Повторный read-only analyze, graph, diff/секреты, обе CI jobs на SHA кода и итоговых документов.

## Post-design C1–C8

PASS при указанной границе: одно application-владение, request key и внешние данные прежние, новые гонки проверяются Red/Green, нет установки и внешнего взаимодействия.

## Complexity Tracking

Новый координатор нужен для устранения доказанного per-consumer side effect; существующие узкие cache modules и совместимые функции сохраняются. Не вводятся глобальный event bus и дополнительный store.
