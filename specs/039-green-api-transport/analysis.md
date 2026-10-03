# Анализ 039 до реализации

Дата: 2026-10-03. Прочитаны spec/checklist, research с матрицей семи операций, plan, data-model, contracts/transport, quickstart, tasks, C1–C8 и исходные адаптеры/tests. Spec Kit `check-prerequisites` подтвердил точный каталог 039. Read-only проход: 880 путей, SHA-256 до/после `328ecf3073ba2cd219bf9e9d4e372badad8d4e55f3e2b4e7a4ab473564d8439f`, unchanged=true; 9 обязательных файлов на месте. Отчёт сохранён отдельно после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. Матрица различает GetState/Account retry без cancel тела, Chats/History retry с cancel и caller signal, CheckAccount/Notifications без retry и SendMessage с pre-dispatch caller abort и deadline-only после dispatch. Транспорт не имеет права унифицировать эти политики. В `FR-006` контролируемое ожидание уже предоставляют waitForRetry инъекции; clock для существующего Retry-After можно контролировать тестовым временем без нового продуктового API.

## Трассировка

| Требование | Задачи | Доказательство |
| --- | --- | --- |
| FR-001 | T001, T003–T007 | transport URL/fetch и матрица |
| FR-002 | T001, T005–T007 | raw Response и методы |
| FR-003 | T001, T003, T005–T007 | signal policy по операции |
| FR-004 | T001, T003, T005–T007 | 429 и запрет SendMessage retry |
| FR-005 | T001, T006–T007 | Retry-After/ACK/Delete false |
| FR-006 | T001, T003, T005–T007 | fetcher/waitForRetry/управляемое время |
| FR-007 | T005–T008 | перенос всех адаптеров |
| SC-001 | T001, T003–T008 | общий transport и независимые integration |
| SC-002 | T001, T005–T008 | матрица ошибок, повторов и отмен |
| SC-003 | T003–T008 | unit и SendMessage no retry |

C1–C8 PASS: варианты и риски названы; 039 отделена от 040; отдельный комплект и анализ предшествуют коду; действующее пользовательское разрешение commit/push учтено; новых пакетов и реальных реквизитов нет; Red → Green → Refactor нового API следует после Passed baseline 179/179; общий слой не поглощает операционные политики.

7 FR, 3 SC, 8 задач; покрытие 10/10; задач без требования 0, существенных неоднозначностей и дублей 0. Новый unit Red/Green, код, E2E и CI пока NotRun и фиксируются в verification.md после выполнения.

## Повторный read-only проход после реализации

После code review исправлена только фактическая матрица: notification deadline — 8 секунд (NOTIFICATION_CONFIG.TIMEOUT_MS), остальные операции — 10 секунд. Добавлены независимые regression-тесты Retry-After (секунды/HTTP-date), Delete false и malformed JSON. Проверены spec/checklist/research/plan/model/contract/tasks, код транспорта и адаптеров. 883 пути; SHA-256 до/после 73d244e30689682cf21d143794222e9a08141e899746286bac1280139f45c4dd, unchanged=true, пропущенных файлов 0. Открытых findings 0; C1–C8 PASS. Запись этого раздела выполнена отдельно после read-only прохода.
