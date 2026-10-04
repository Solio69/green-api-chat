# Read-only analysis: 050

Дата: 2026-10-04. Анализ выполнен после технического плана и до правок кода. Статус: PASS с уточнениями ниже.

## Traceability

| Требование | Исходное наблюдение | Задача / проверка |
| --- | --- | --- |
| FR-001 | `tests/constants.ts` содержит 39 exports разных областей | T004; typecheck и поиск import-циклов |
| FR-002 | Query fixture хранит один mutable object через `Symbol.for`; Vitest уже создаёт QueryClient на вызов helper и очищает timers | T003–T005; reset до/после и проверка late send |
| FR-003 | `recipient-search-ui.spec.ts` содержит `setTimeout(300)`; fake provider намеренно имитирует задержки | T004–T005; управляемый gate и status assertion |
| FR-004 | E2E fake maps/counters process-global, workers=1; Query reset только в трёх `beforeEach` | T003–T005; owner fixtures `try/finally`, repeat/order |
| FR-005 | `tests/protocol.constants.ts` независим; Query fake импортирует production response/error/notification constants | T004–T005; test literals и отрицательный oracle |
| FR-006 | Playwright проверяет реальные Web Locks/cookie/focus/geometry | T004–T005; только provider boundary |
| FR-007–008 | Существующие runners/пакеты достаточны | T005–T007; отдельные и полные прогоны |

## Consistency and gaps

- Спека, план, model, contract, quickstart, tasks согласованы: одна тестовая задача, без product behavior. C1–C8 PASS; прежнее разрешение пользователя на полный цикл покрывает эту задачу.
- Query app `notificationFixture` возвращает ссылку `state`; при reset нельзя просто заменить локальный объект без изменения публичного getter. Нужен getter или эквивалентный метод, чтобы route читал новый snapshot.
- Query browser context создаётся Playwright отдельно для каждого теста; клиентский QueryClient создаётся в `QueryProvider` для нового page. Два contexts одного сценария делят только серверную fixture по контракту.
- Очистка E2E через login route должна выполняться вне браузерного и штатного `request` контекстов: отдельный Playwright API-контекст с `dispose()` без передачи cookie. Проверять HTTP 200 и `status: ok`, иначе fail setup/teardown. Sentinel существует только в test fake.
- Отложенные `setTimeout` доставки/прочтения должны сравнивать generation; send после reset не меняет counters. Текущий serial runner ограничение сохраняется явно.
- Проверка исходного общего state должна использовать обратимый тестовый сценарий, а не оставлять падающий тест в постоянном наборе. Отрицательный oracle также временный.
- `login-form-safety.spec.ts` единственный E2E spec мимо owner fixture; все Query specs должны использовать новый owner fixture, хотя лишь часть трогает серверную очередь.

## Verdict

Критических неоднозначностей, новых зависимостей и скрытого изменения пользовательского поведения нет. Перед реализацией зафиксировать baseline; затем test fixture Red → Green, полная регрессия и post-analysis. Не путать ошибку сборки или окружения с целевым Red.
