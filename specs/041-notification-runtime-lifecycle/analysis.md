# Анализ 041 до реализации

Дата: 2026-10-03. Проверены spec/checklist, research, plan, data-model, contracts/notification-cycle, quickstart, tasks, C1–C8, AGENTS/Git/CODING_RULES и процесс. Read-only проход: 901 путь, SHA-256 до/после `b2385810f3566fd522655b6a746831a2ca39856e00ae017d5c4af371d420433b`, unchanged=true; 13 прочитанных обязательных файлов. Отчёт сохранён отдельным действием после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Существенных неразрешённых вопросов о поведении, данных и безопасности нет: прежние ACK/receive/lease/timing и UI-контракт явно сохранены; инъекции времени, ожидания, transport и random служат детерминированной проверке, их production defaults совпадают с текущими. Серверный protocol и задачи 043/050 не захватываются.

## Трассировка

| Требование | Задачи | Доказательство |
| --- | --- | --- |
| FR-001 | T001, T003–T006 | runtime/контроллер и последовательность |
| FR-002 | T001, T003–T006 | сроки и backoff/Retry-After |
| FR-003 | T001, T003–T006 | apply до ACK, invalid без ACK |
| FR-004 | T001, T003–T006 | proof/expiry/no duplicate |
| FR-005 | T001, T005–T006 | Web Lock и две вкладки |
| FR-006 | T003–T006 | controlled ports и время |
| FR-007 | T001, T003–T006 | abort, late lock и lifecycle |
| FR-008 | T001, T005–T006 | refresh/recovery/one loop |
| SC-001 | T003–T007 | unit+integration timing/ACK |
| SC-002 | T001, T003–T007 | RTL и browser Web Locks |
| SC-003 | T001, T005–T007 | Query recovery/refresh |

C1–C8 PASS: варианты и цена описаны; задача 041 отдельно от 040/043/050; полная подготовка и анализ предшествуют коду; существующее разрешение commit/push учтено; новых пакетов/реальных данных нет; исходное покрытие polling 15/15 и RTL 8/8 подтверждено; для новой инъекции есть поведенческий Red → Green → Refactor; решение соразмерно. 8 FR, 3 SC, 7 задач; покрытие 11/11, задач без требования 0, существенных неоднозначностей/дублей 0. Фактические результаты Red/Green, E2E и CI отражены в [verification.md](verification.md).

## Повторный read-only анализ после реализации

Прочитаны 17 файлов комплекта, нового runtime, контроллера, transport/refresh и тестов. 906 путей, SHA-256 до/после `301f7e91c0b6f18f9f497484205f07311d9d44250b17f2cad5c760ccf0c3085e`, unchanged=true. Открытых findings: 0. Последовательность apply → ACK, pending proof, Retry-After/backoff, close/late response и один Web Lock соответствуют FR-001–FR-008; состояние и подписки остаются у контроллера, сеть и timing — в runtime/transport. Публичный API сохраняет форму, новые ports опциональны. Фактические тесты и CI фиксируются в verification.md.
