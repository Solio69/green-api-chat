# Анализ 036 до переноса кода

Дата: 2026-10-03. Прочитаны spec/checklist, research, plan,
data-model, contracts/auth-module, quickstart, tasks, карта 035,
исходные auth/session/routes/pages и соответствующие tests.
Spec Kit `check-prerequisites` вернул точную директорию 036.
Read-only проход: 838 путей, SHA-256 до/после
`7c3656d30270f44268dfc7e07a695308329213a9187292f1d27a55a5598fddd0`,
`unchanged=true`; этот отчёт записан после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Выявленная смешанная
`src/lib/auth/constants.ts` разбивается на model/server, а
`session.ts` остаётся до 037. Зависимости `getQueryScope` от типа
старой сессии и chats config названы переходными до 037/048.
Существуют 19 импортов пяти старых auth-путей в `src`/`tests`;
каждый должен быть обновлён или обоснован до завершения 036.
Чистый перенос не нуждается в искусственном Red; текущие
поведенческие тесты и удалённый CI дают baseline.

## Трассировка

| Требование | Задачи | Проверка |
| --- | --- | --- |
| FR-001 | T003–T005 | Пять файлов, public entries, Next routes на месте |
| FR-002 | T003–T005 | Раздельные model/application/server и client import scan |
| FR-003 | T001, T004, T005 | Session tests, 24 ч и cookie flags |
| FR-004 | T001, T004–T006 | Auth/home/login/logout E2E/integration |
| FR-005 | T004, T005 | Нет старых auth-путей и server import в client |
| FR-006 | T001, T003–T005 | `session.ts` и компоненты остаются |
| SC-001 | T005, T006 | Typecheck, build, public imports |
| SC-002 | T005, T006 | Поведенческая регрессия |
| SC-003 | T004–T006 | Ограниченный diff |

C1–C8: PASS. Варианты и цена указаны; область не расширена;
подготовка и read-only анализ предшествуют коду; refactor
авторизована; зависимостей/секретов нет; предусмотрены поведенческие
проверки и разделение server/client.

6 FR, 3 SC, 6 задач; покрытие 9/9, необоснованных задач 0.
Реализация и её проверки будут записаны в verification.md.
