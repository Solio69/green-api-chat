# Анализ 040 до реализации

Дата: 2026-10-03. Прочитаны spec/checklist, research с переходами контроллера, plan, data-model, contracts/connection-state, quickstart, tasks, C1–C8, текущий polling-контроллер, NotificationProvider/Notice и tests. Spec Kit подтвердил точный каталог 040. Read-only проход: 890 путей, SHA-256 до/после `84fdddeb80fd9e978eb8ef004db3a10d03efb2e14446c64c463925e47f9f1f33`, unchanged=true; 9 обязательных файлов на месте. Отчёт сохранён отдельным действием после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Матрица различает connected с pending ACK, retrying с сохранённым proof и ограниченную отправку; отключённые outgoing status webhooks не блокируют саму отправку. Recovery зависит от прежнего успешного connected и перехода из иного статуса, а не от каждого polling-цикла. Generation guard и terminal close исключают позднее восстановление. Общий reducer не принимает сеть, таймеры, DOM или QueryClient. Сетевой цикл остаётся задачей 041.

## Трассировка

| Требование | Задачи | Доказательство |
| --- | --- | --- |
| FR-001 | T001, T003–T005, T007 | union и таблица состояний |
| FR-002 | T003–T005, T007 | чистый transition и команды |
| FR-003 | T001, T003–T007 | projection canSend/issue и UI |
| FR-004 | T001, T003–T005, T007 | pending ACK события/цикл |
| FR-005 | T001, T003–T007 | failure variants/manual retry |
| FR-006 | T001, T003, T005–T007 | notice/recovery regression |
| FR-007 | T003–T008 | stale/repeated/terminal tests |
| SC-001 | T003–T008 | таблица переходов и union |
| SC-002 | T001, T003–T008 | polling integration |
| SC-003 | T001, T003, T005–T008 | RTL/UI и recovery |

C1–C8 PASS: варианты и риск названы; модель 040 отделена от сети 041; полный комплект/read-only предшествуют коду; существующее разрешение commit/push учтено; новых пакетов/реальных данных нет; новый transition проходит Red → Green → Refactor после Passed baseline 14/14; UI сохраняет публичный snapshot.

7 FR, 3 SC, 8 задач; покрытие 10/10; задач без требования 0, существенных неоднозначностей и дублей 0. Unit Red/Green, код, RTL, E2E и CI пока NotRun и фиксируются в verification.md после выполнения.

## Повторный read-only анализ после реализации

Прочитаны 14 файлов полного комплекта, модели, контроллера и тестов; проверены границы client/server, переходы ACK/retry/recovery, соответствие FR-001–FR-007 и SC-001–SC-003. 894 пути, SHA-256 до/после `e99ea7731affeac44a488644f4f8ccf4d42e99eabc6367cbe06caa4e7cc8ad33`, unchanged=true. Открытых findings: 0. Публичный snapshot сохранил прежнюю форму и стабилен при внутренних переходах pending ACK; fetch, lease, таймеры и Query остались за пределами чистой модели. Полные проверки и CI фиксируются отдельно в verification.md.
