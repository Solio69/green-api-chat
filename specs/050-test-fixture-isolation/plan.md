# Implementation Plan: изоляция тестовых фикстур 050

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Согласование и реализация**: пользователь разрешил полный цикл 028–055, включая spec, код, проверки, commit/push в `refactor`.

## Summary

Разделить доменные тестовые контракты, централизовать reset общего fake-сервера на границах каждого Playwright-сценария и защитить отложенные события поколением состояния. Query-стенд получает такую же фикстуру до/после сценария. Убрать произвольный sleep из UI-проверки, сохранив проверку состояния pending. Ожидания протокола остаются независимыми от production-констант.

## Considered Options

| Вариант | Преимущества | Риски | Выбор |
| --- | --- | --- | --- |
| Отдельный процесс сервера на каждый тест | Полная память на сценарий | Дорогие сборки и сложная конфигурация | Нет |
| Уникальные ID и отдельный тестовый HTTP reset route | Можно распараллелить | Новая публичная точка приложения и риск смешения с продуктом | Нет |
| Сериализация и reset через существующий login route в отдельном Playwright API-контексте с тестовым sentinel | Нет продуктового маршрута и зависимостей; fixture автоматическая | Общий процесс требует workers=1; login route становится setup-зависимостью | Да |

## Technical Context

Next 16/React 19/TypeScript 5; Vitest и три последовательных Playwright-конфигурации. E2E fake загружается только в тестовый app process через `NODE_OPTIONS`. Query fixture принадлежит отдельному тестовому Next app. Реальные browser cookie/Web Locks/focus/geometry не подменяются. Пакеты, продуктовые маршруты и функциональность не меняются.

## Constitution Check

C1–C3 PASS: задача и полный самостоятельный цикл согласованы пользователем, изменение тестовое. C4 PASS: узкое исключение на commit/push в `refactor`. C5–C6 PASS: без установки и реальных данных. C7 PASS: read-only анализ до кода, регрессионная опора на CI 049, отрицательный контроль oracle и проверки в разных порядках. C8 PASS: существующие Playwright/Vitest и тестовые endpoints.

## Research and Design

[research.md](research.md) фиксирует наблюдения и альтернативы; [data-model.md](data-model.md) — время жизни фикстуры; [contracts/fixture-isolation.md](contracts/fixture-isolation.md) — reset и oracle; [quickstart.md](quickstart.md) — проверки. Это тестовый контракт, новая продуктовая HTTP-схема не требуется.

## Project Structure

`tests/constants.ts` станет совместимым barrel, доменные константы переходят в `tests/{account,auth,recipients,conversation,theme,query,shared}.constants.ts`; независимый `tests/protocol.constants.ts` сохраняется. `tests/e2e/fixtures/fake-green-api.ts` и новый `reset-contract.json` реализуют тестовый reset; `tests/e2e/owner-fixture.ts` обеспечивает автоматический lifecycle, `login-form-safety.spec.ts` использует его. `tests/query/owner-fixture.ts` и specs Query — аналогичный lifecycle; `tests/fixtures/query-app/lib/notification-fixture.ts` получает свежий state/generation на reset. `tests/e2e/recipient-search-ui.spec.ts` заменяет sleep управляемым Promise. `specs/050-*` и roadmap фиксируют результат. Точные файлы и задачи перечислены в [tasks.md](tasks.md).

## Tasks and Dependencies

T001 инвентарь и baseline → T002 read-only анализ → T003 regression контроля изоляции/oracle → T004 фикстуры и константы → T005 отдельные/переставленные сценарии и полный набор → T006 review/verification → T007 commit/push/CI/docs. Для тестовой инфраструктуры TDD на продуктовое поведение неприменим; новый контроль изоляции сначала должен воспроизвести общий state (Red), затем пройти (Green).

## Verification

Команды и критерии [quickstart.md](quickstart.md). Исходная опора — зеленый CI 049 и локальные выбранные сценарии до изменения. Проверить ошибку setup/cleanup, отложенный send, независимость oracle временной намеренной порчей ожидания с последующим откатом, одиночный и переставленный Playwright порядок; затем typecheck/lint/styles/format/Vitest/integration/Query/E2E. Ошибка окружения не является доказательством Red.

## Post-design Constitution Check

C1–C8 PASS: проект ограничен тестовыми ресурсами, сценарии проверяемы, публичного поведения нет. Анализ после проектирования отдельный и read-only.

## Complexity Tracking

Автоматический test fixture нужен, чтобы очистка после падения не зависела от дисциплины каждого spec. Generation нужен из-за уже существующих `setTimeout` в fake; новый пакет или инфраструктура не вводится.
