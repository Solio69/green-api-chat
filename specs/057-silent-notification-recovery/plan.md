# Implementation Plan: Незаметное восстановление уведомлений

**Spec**: [spec.md](spec.md)  
**Дата**: 2026-10-04  
**Согласование**: Пользователь выбрал полное удаление плашки и обычную независимую отправку.  
**Разрешение на реализацию**: Пользователь возобновил задачу сообщением «Načinaj realizáciu». Состояние рабочего дерева после соседнего чата сверено; реализация и проверки выполнены локально. Без commit/push.

## Summary

Удалить визуальную ветку retrying из NotificationNotice. Доступность отправки вычислять как connected либо retrying после успешного подключения. Контроллеры отправки, владение вкладкой, HTTP, ACK и retry получения сохраняются. Новых механизмов ожидания или повторов сообщений нет.

## Considered Options

| Вариант | Польза | Ограничение | Решение |
| --- | --- | --- | --- |
| Независимая отправка, без плашки | Не мешает работе при сбое фонового чтения; использует готовые состояния отправки | Ошибка самого POST остаётся видна | Выбран пользователем |
| Ожидание восстановления перед отправкой | Не начинает запрос при проблемах чтения | Требует очереди, отмены и срока ожидания | Не выбран |
| Задержка плашки или статус у аккаунта | Сохраняет явный статус восстановления | Продолжает отвлекать | Пользователь попросил убрать полностью |

## Technical Context

Next.js 16.3.7, React 19.3, TypeScript 5.9.3, TanStack Query 5.104; существующие Vitest/RTL и Playwright. Данные и серверные контракты не меняются. Изменения 056 входят в текущий main и не затронуты.

## Constitution Check

C1 PASS: поведение выбрано пользователем, неизвестная причина production-сбоя указана явно.
C2 PASS: одна небольшая клиентская задача.
C3 PASS: поведение согласовано, реализация отдельно возобновлена пользователем; Red → Green → Refactor выполнены.
C4 PASS: только read-only Git.
C5 PASS: установка и миграции не нужны.
C6 PASS: отдельная 057, синтетические данные, сохранение 056.
C7 PASS: подтверждён поведенческий Red, выполнены Green и финальные проверки; анализ read-only.
C8 PASS: готовые механизмы используются без очереди и новых зависимостей.

## Research and Design

- [research.md](research.md): фактические владельцы поведения и варианты.
- [data-model.md](data-model.md): матрица доступности отправки.
- [contracts/recovery-ui.md](contracts/recovery-ui.md): UI и сохранённый протокол.
- [quickstart.md](quickstart.md): команды и ручная проверка.
- [test-scenarios.md](test-scenarios.md): матрица выполненных поведенческих проверок, включая ошибки и границы.
- [verification.md](verification.md): фактические результаты Red, Green, регрессии и ограничения.
- Clarify: UX, ошибки, повторы, данные, границы и зависимости Clear; вопрос о способе отправки закрыт ответом пользователя. БД/миграции NotApplicable.

## Project Structure

Изменённые файлы приложения:
- src/features/conversation/notifications/model/connection-model.ts — проекция canSend.
- src/features/conversation/ui/NotificationNotice/NotificationNotice.tsx — удалить ветку временного восстановления; именованный обработчик retry при ревью затронутого JSX.
- src/features/conversation/ui/NotificationNotice/constants.ts — удалить неиспользуемый текст.
- README.md — кратко описать фоновое восстановление и независимость отправки; сохранить правки 056.

Проверки:
- tests/unit/notification-connection-model.test.ts — retrying после подключения разрешает отправку, до него блокирует; сохранить ACK.
- tests/component/notification-notice.test.tsx — повторные сбои не показывают плашку; проверить все сохранённые предупреждения и независимую MessageIssue, расширив существующий mock useMessageIssues.
- tests/component/provider-lifecycle.test.tsx — только запуск регрессии; существующий consumer уже наблюдает состояние независимо от плашки, изменения не нужны.
- tests/integration/polling-connection.test.ts — доступность отправки и recovery настоящего контроллера.
- tests/e2e/notification-recovery.spec.ts — новый сценарий на двух ширинах: повторные сбои, стабильная геометрия, одна удержанная отправка и успешное завершение.
- tests/tsconfig.json — конфигурация редактора, наследующая Vitest-настройки без включения компонентных тестов в сборку приложения.
- tests/notifications/constants.ts, tests/notifications/ui-constants.ts и tests/protocol.constants.ts — независимые тестовые значения для повторяемых состояний, текстов и маршрута.
- specs/057-silent-notification-recovery/ — этот комплект, analysis.md и verification.md.

## Tasks and Dependencies

T001 подготовка и read-only анализ → T002 сверка актуального кода, сохраняемые unit/component/integration тесты и поведенческий Red → T003 минимальное исправление и Green → T004 браузерная регрессия → T005 Refactor, документация, итоговые проверки и review. Полная карта в [tasks.md](tasks.md).

## Verification

- Red: целевые Vitest тесты должны падать на видимой плашке и canSend=false после временного сбоя; ошибка среды не считается Red.
- Green: тот же набор после минимального исправления.
- Финал: npm test, npm run lint, npm run lint:styles, npm run typecheck, npm run test:e2e (включает production build), форматирование только затронутых файлов и git diff --check.
- Полный format:check имеет известную проблему CRLF в нетронутых файлах checkout, описанную в 056. Массового форматирования нет.
- Query fixture не меняется, но импортирует NotificationProvider: поэтому полный test:query выполнен как регрессия.
- `node node_modules/typescript/bin/tsc --noEmit --project tests/tsconfig.json` и `--showConfig` подтверждают отдельный тестовый проект, алиас `@/` и включение DOM setup с `jest-dom` matchers.
- E2E управляет завершением HTTP через deferred promises, без произвольных sleep. Проверяет геометрию 360/1280, индикатор и число отправок.
- После завершения серии отдельно выполнить read-only анализ с проверкой хешей и сохранить analysis.md; verification содержит фактические результаты.

## Post-design Constitution Check

C1–C8 PASS по тем же основаниям. Причина production-сбоев не диагностирована и не заявляется исправленной. Никаких дополнительных продуктовых решений.

Перед реализацией проверены git status и diff, заново прочитаны затрагиваемые файлы. Изменения соседнего чата уже входили в main; эта задача их не перезаписала.

## Complexity Tracking

Новых абстракций, состояния UI, хранения и зависимостей нет. Используется существующий everConnected.
