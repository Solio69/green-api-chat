# Анализ 048 до реализации

Дата: 2026-10-04. Проверены spec/checklist/research/plan/data-model/contract/quickstart/tasks, карта 035, `lib/chats`, шесть UI каталогов, provider/route/QueryProvider и целевые тесты. Первый read-only проход: 49 путей, SHA-256 `2b1a5fc3b57f25d65fca5603417d54473e8007bf4f194e7df92f8867c2fa4633`, unchanged=true.

## Findings и исправления технического плана

- MEDIUM-01: карта 035 не содержит появившийся позже `chats-query-options.ts`, а физический перенос `session-chat-facts.ts` отложен после логической задачи 043. План и T004 дополнены точечным обновлением этих двух строк карты в 048.
- MEDIUM-02: UI hooks сейчас импортируют публичный `@/components/QueryProvider`; немедленный перенос самого QueryProvider в shared создал бы shared→conversation runtime зависимость через `createConnectionSession`. Research/plan явно оставляют публичный переходный вход до 049/054, без нового facade или обратного импорта. FR-007 требует, чтобы QueryProvider не импортировал chats и chats не импортировал внутренние компоненты переписки; текущий граф это выполняет.
- MEDIUM-03: `normalizeChats` имеет type-only импорт server `get-state` для credentials. Plan уточнён: в чистой model используется структурная пара credential strings без server type import; значение и фильтрация не меняются.

Документальные исправления выполнены отдельно от анализа. Повторный read-only проход: 49 путей, SHA-256 `a5f409709baccf53f88c685f667a598aa1629e299805378d1d8eb4b81f83d7c8`, unchanged=true. Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Нет смены сетевого/визуального контракта и новой бизнес-логики; старые пути исчезнут после реализации.

## Покрытие требований

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T001, T004–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T002, T004–T006 |
| SC-001 | T004–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

7 FR, 3 SC, 7 задач; покрытие 10/10, задач без связи с приёмкой 0, существенных неоднозначностей/дублей 0. T001 baseline, T002 анализ, T007 CI/документация входят в процесс подтверждения.

## C1–C8

- C1 PASS: три варианта/издержки описаны, неизвестное поведение не придумывается.
- C2 PASS: chat list отдельно от истории, отправки и уведомлений; общий badge доказан двумя потребителями.
- C3/C4 PASS: пользователь ранее разрешил полный цикл 030–055 и commit/push `refactor` этому чату.
- C5/C6 PASS: без пакетов, БД, реальных секретов и отправки сообщений.
- C7 PASS: чистый перенос опирается на baseline, unit/RTL регрессии идут до него. Для изменения поведения потребуется отдельный поведенческий Red до кода.
- C8 PASS: существующий QuerySession и один кеш; новые слои лишь фиксируют нынешние обязанности.

Фактические baseline, код, тесты, post-analysis и GitHub CI зафиксированы в verification.md. Read-only проход до реализации завершён до записи этого отчёта; файл сохранён отдельным действием.

## Read-only анализ после реализации

Проверены 91 путь комплекта 048, карты 035, нового chats/model/application/server/ui, shared badge, всех затронутых consumers и тестов; SHA-256 до/после `df86a6cac11bcdda9c84485b047588f85ca11b9fb2747a6d952408d4a994353a`, unchanged=true. Старых runtime/test импортов `lib/chats` и `components/ChatList*`/`ChatSidebar`/`ChatUnreadBadge` нет. `chats/model`, `application` и `ui` не импортируют server runtime; QueryProvider не импортирует chats. Граф: 28 client roots, 253 TS/TSX, server runtime reachable=false. Карта 035 получила строку позднего query-options и уточнение физического переноса session-chat-facts. Переходный публичный QueryProvider остаётся задачей 049/054, его внутренняя реализация не зависит от списка. C1–C8 PASS, покрытие 10/10, открытых findings 0. Результаты тестов отдельно в verification.md.
