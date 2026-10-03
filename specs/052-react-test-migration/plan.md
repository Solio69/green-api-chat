# Implementation Plan: перенос React-проверок в Testing Library 052

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Разрешение**: пользователь поручил полный цикл 030–055 и commit/push в `refactor` без повторного согласования.

## Summary

Из 46 текущих Query Playwright сценариев перенести девять, где проверяемый результат принадлежит React/Query provider, в четыре RTL файла. Сохранить 37 проверок, зависящих от настоящего Next/browser/HTTP/console/DOM geometry. Перед удалением старого теста подтвердить старый и новый Green и эквивалентность ID/состояний. Удалить единственный ставший неиспользуемым `SessionOverlayProbe` и ветку страницы test app; остальные probes нужны браузерным контрактам. Ни одного нового пакета и изменения приложения.

## Варианты и выбор

| Вариант | Плюс | Риск | Решение |
| --- | --- | --- | --- |
| Всё оставить в Playwright | Ноль миграционных правок | Дорогая обратная связь и неясная граница React | Нет |
| Всё перенести в jsdom | Быстро | Нельзя доказать реальный браузер/Next/Web Locks/scroll | Нет |
| Разделить по наблюдаемой границе | RTL для provider state, Playwright для браузера | Нужна по-ID карта и аккуратное удаление | Выбран |

## Technical Context and C1–C8

Установленные версии и API подтверждены в [research](research.md). C1–C4 PASS: единая задача 052, разрешение полного цикла и узкий Git commit/push действуют. C5–C6 PASS: пользовательские данные, продуктовые маршруты и новые зависимости не затронуты. C7 PASS: миграция существующего поведения через baseline/parity, не искусственный TDD. C8 PASS: четыре тестовых файла сгруппированы по реальному provider/домену; нет нового testing framework или универсального harness ради одного сценария. После проектирования C1–C8 PASS.

## Структура и файлы

- [inventory](inventory.md) и [scenario map](scenario-map.json): 46 ID и точные решения.
- `tests/component/history-provider-contract.test.tsx`: четыре асинхронных сценария с реальными provider/QueryClient, controlled fetch, shared consumer, A→B→A, pending close и scope/session reset.
- `tests/component/selection-provider-contract.test.tsx`: три сценария с настоящими provider/UI, двумя consumers, Strict Mode, сохранением cache и editor epoch.
- `tests/component/chats-query-contract.test.tsx`: loading vs successful empty с реальным `useChats`, QueryProvider и controlled fetch.
- `tests/component/session-chat-overlay.test.tsx`: известный chat остаётся после empty/error refresh с реальными `useChats`, overlay и chat list.
- `tests/query/history-query.spec.ts`, `conversation-selection.spec.ts`, `chat-query.spec.ts`: удалить только доказанно перенесённые тесты; оставшиеся заголовки/предусловия сохранить. `session-chat-overlay.spec.ts`: удалить после parity. `tests/fixtures/query-app/components/SessionOverlayProbe/*` и ветку `?overlay` в `tests/fixtures/query-app/app/page.tsx`: удалить после отсутствия потребителей. Иные fixture routes/probes остаются.
- `specs/052-*`, roadmap, README только если меняется фактическая команда (скрипты не меняются). CI автоматически находит новые Vitest/Playwright файлы.

## Проверка

Baseline 051: Vitest 461/461, Query 46/46, E2E 112/112, обе CI jobs. Сначала RTL тесты и старый Query Green. Сверить все 46 ID, девять новых RTL assertions/отказов, 37 оставшихся browser. Затем удалить старые тесты/probe и выполнить typecheck/lint/styles/format, `npm test`, `npm run test:query`, `npm run test:e2e`. Отрицательный oracle одного ключевого RTL assertion временный, исходник восстановить. Read-only post-analysis и staged diff review до commit/push; обе CI jobs + artifacts после push.

## Зависимости

050/051 → inventory/plan → read-only analysis → RTL parity → удаление старых проверок и unused probe → полная регрессия/review → commit/push/CI → verification/roadmap. Подробности в [tasks.md](tasks.md). Сложность ограничена четырьмя тематическими RTL файлами и картой, которая нужна для доказуемого перехода.
