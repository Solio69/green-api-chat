# Implementation Plan: перенос Node-проверок в Vitest 051

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Согласование и реализация**: пользователь разрешил полный цикл 030–055, включая spec, код, ревью, commit/push в `refactor`.

## Summary

Перенести 366 сценариев из 28 Node/Playwright файлов в `tests/unit/*.test.ts` (семь чистых групп) и `tests/integration/*.test.ts` (21 группа взаимодействия модулей). Сохранить точные заголовки, B028 ID и 15 новых ID в карте. Добавить Vitest integration project с Node, общим cleanup и таймингом нынешнего runner; `npm test` исполняет unit/integration/component один раз. После подтверждённого Green удалить старые `.spec.ts` и пустую Playwright-конфигурацию, обновить `test:integration` и CI. Настоящие HTTP/cookie/браузерные сценарии остаются Playwright E2E/Query.

## Considered Options

| Вариант | Преимущества | Ограничения | Решение |
| --- | --- | --- | --- |
| Отдельный Vitest integration project | Ясное разделение unit/реальных модулей, отдельная команда и отчёт, один общий CI запуск | Дополнительный раздел конфигурации | Выбран |
| Сложить все Node-проверки в unit project | Меньше конфигурации | Стирает различие интеграции модулей и затрудняет выборочный запуск | Нет |
| Оставить Node-тесты в Playwright | Нет миграционных правок | Два runner для одной Node-области, дублирование CI и медленнее обратная связь | Нет |

## Technical Context

Next 16.3.7, React 19.3.0, TypeScript 5.9.3, Vitest 5.0.3, Playwright 1.63.0 из lockfile. `vitest.config.mts` уже использует inline `projects`; установленный Vitest реализует `expect.poll`. Официальные [Vitest projects](https://vitest.dev/guide/projects) и [expect.poll](https://vitest.dev/api/expect) подтверждают поддержку; [async assertions](https://vitest.dev/guide/learn/async) требуют `await`. До удаления старого набора оба runner сохраняются. Пакеты и поведение приложения не меняются.

## Constitution Check

C1–C3 PASS: перенос согласован, отдельная 051 и прежнее разрешение полного цикла. C4 PASS: ограниченный commit/push `refactor` разрешён пользователем. C5–C6 PASS: новые пакеты/данные не нужны. C7 PASS: исходный 366/366 и по-ID сравнение до удаления старого набора; без искусственного TDD для чистого переноса. C8 PASS: отдельный проект ради настоящих интеграций, без новой mock-инфраструктуры.

## Research and Design

[research](research.md), [inventory](inventory.md), [scenario map](scenario-map.json), [data model](data-model.md), [runner contract](contracts/test-migration.md), [quickstart](quickstart.md). Новый продуктовый HTTP contract не создаётся.

## Project Structure

Полные 28 пар исходного/целевого файла перечислены в [inventory.md](inventory.md). Уже существующий `tests/unit/account-profile.test.ts` остаётся; полная старая матрица переходит в `account-profile-contract.test.ts` без перезаписи двух новых проверок. `vitest.config.mts`: integration Node project, `expect.poll`/test timeout соразмерны прежним тестам. `tsconfig.vitest.json`: include integration. `package.json`: `test:integration` вызывает Vitest project. `.github/workflows/quality.yml`: npm test уже содержит integration, поэтому убрать отдельный дублирующий шаг. `playwright.integration.config.ts`: удалить только после равного Green. `tests/integration/polling-connection.test.ts`: `test.afterEach` заменить на Vitest `afterEach`. `specs/051-*` и roadmap: артефакты и статус.

## Tasks and Dependencies

T001 baseline/list/ID → T002 read-only analysis → T003 копирование с сохранением старого набора и запуск Vitest по областям → T004 исправление только runner-несовместимостей и проверка интеграции настоящих модулей → T005 по-ID сравнение/Green, затем удаление старого набора и изменение команд/CI → T006 полная регрессия/review → T007 commit/push/CI и документы. Детали в [tasks.md](tasks.md).

## Verification

Исходная интеграция 366/366 из 050. После копирования до удаления сравнить 366 IDs/заголовков, запустить новый Vitest project и старый Playwright набор; затем удалить старый и повторить `npm test`, `npm run test:integration`, typecheck/lint/styles/format, Query/E2E и CI. Проверить `expect.poll` с адаптированным timeout, завершение ресурсов и отсутствие act/unhandled warnings. Отрицательный контроль выбранного существенного assertion временный. Failed/Blocked/NotRun отличать от Passed; ошибка окружения не считается поведенческим Red.

## Post-design Constitution Check

C1–C8 PASS после выбора: один тестовый уровень на контракт, старый runner удаляется после доказанной эквивалентности, внешний продукт не меняется. Read-only analysis отдельно проверит карту и полноту задач.

## Complexity Tracking

Отдельный Vitest project добавляет один логический раздел, но убирает Playwright конфигурацию и повторный CI запуск. 366 записей scenario map необходимы для устойчивой трассировки, а не для искусственного покрытия числом.
