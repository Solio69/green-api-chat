# Implementation Plan: чистая модель сообщений и статусов 042

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: последовательный полный цикл 030–055 и commit/push `refactor` уже поручены.

## Summary

Сохранить `merge-message-facts.ts` как чистый доменный модуль, дать ему канонический вход с валидированными `MessageFact` (DTO + источник), отдельный `MessageView` и ключ `(chatId,idMessage)` для сообщений и provenance. Существующий `mergeMessageFacts({messages,source})` остаётся переходным adapter, пока cache coordinator 043 не принимает новый вход. Убрать non-null assertions/casts в ранних статусах и статусной нормализации через guards. HTTP/Query/UI формы данных не менять.

## Основание и C1–C8 до проектирования

[Research](research.md) фиксирует фактические правила и три варианта. C1 PASS: технический выбор и риск названы. C2 PASS: 042 ограничена моделью, 043 — Query orchestration. C3 PASS: поручение полного цикла и разрешение реализации сохраняются. C4 PASS: пользовательское исключение commit/push в refactor. C5 PASS: новых пакетов/БД нет. C6 PASS: фиктивные данные. C7 PASS: targeted baseline 26/26, новая коллизия проходит Red → Green → Refactor. C8 PASS: минимум новых типов/адаптер без framework.

## Модель и контракт

[Data model](data-model.md), [merge contract](contracts/message-facts.md), [quickstart](quickstart.md). `MessageDTO` — нормализованный ответ HTTP/истории/уведомления после внешней валидации; `MessageFact` — `{message,source}` с проверенной chatId/idMessage и валидным источником; `MessageView` — отображаемый результат объединения (та же публичная форма полей без source). Канонический merge принимает факты в порядке поступления, текущую модель и provenance. Для каждого сообщения ключ `JSON.stringify([chatId,idMessage])`; source rank и status rank сохраняются. Wrapper принимает прежние `messages+source`, создаёт факты и вызывает канонический merge. Валидация до применения остаётся атомарной; invalid факты не меняют cache.

Ранние статусы сохраняют прежние TTL, limit, sequence и matching по составному ключу. Внутри branch с issue локальная проверенная переменная заменяет `!`; невозможный для provider status `null/accepted` отклоняется явно вместо cast. `normalizeMessageStatus` получает узкий type guard статуса/идентификаторов вместо `as` после boolean проверок. Если тесты выявят изменение контрактного результата, исправить до завершения задачи; новые медиа/сортировка не вводятся.

## Файлы и порядок

- Изменить `src/lib/messages/types.ts`, `merge-message-facts.ts`, `validate-message.ts` при необходимости; `src/lib/notifications/normalize-message-status.ts` для проверенной типизации. `message-cache.ts` и `normalize-history.ts` используют совместимый adapter без перемещения Query (043). UI не меняется.
- Новый `tests/unit/message-domain.test.ts` для source precedence, двух чатов с одинаковым ID, подтверждённого read, раннего TTL/limit, конфликтов/immutability; новая коллизия сначала Red на текущем коде. Возможны дополнительные целевые тесты валидатора при обнаруженном пробеле. Существующие `tests/integration/{history-query,message-cache,message-statuses}.spec.ts` — регрессия.
- Документы `specs/042-message-domain-model/*`, roadmap после CI.

T001 baseline/матрица → T002 read-only analyze → T003 тест коллизии Red + unit матрица → T004 типы/канонический merge Green → T005 убрать assertions/проверить внешние нормализаторы и кеш adapter → T006 полная регрессия/повторный analyze/review → T007 commit/push/CI/docs. Сообщения одного чата сохраняют тот же порядок/содержимое.

## Проверки

`npx vitest run --project node tests/unit/message-domain.test.ts` Red/Green; targeted 26 integration; полный `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, `npm run test:integration`, `npm run test:query`, `npm run test:e2e` последовательно для Playwright; client/server graph, diff/секреты и обе CI jobs на SHA. Новые тесты без реальных credentials.

## Post-design C1–C8

PASS при описанной границе: источник и identity явно заданы, backend/Query/UI не переписаны, модель остаётся Node-чистой; все изменения поведения проходят TDD и регрессию. Действий пользователя нет.
