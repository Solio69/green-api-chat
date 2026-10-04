# Анализ 043 до реализации

Дата: 2026-10-03. Проверены spec/checklist/research/plan/data-model/contracts/conversation-cache/quickstart/tasks, C1–C8 и 13 исходных файлов/правил. Первый read-only проход: 21 путь, SHA-256 до/после `d44cf53fb68d4d1c7710684e2815f390f2c60986a2d9d8b4a9c4644cdbe18388`, unchanged=true. После исправления технической неоднозначности второй read-only проход: 21 путь, SHA-256 до/после `a09a7b5d793068bc5c8e3d34ab1c19fe1e3823b31537cce239457992d2d10cd7`, unchanged=true. Отчёт записан отдельным действием после прохода.

## Findings

Первый проход: MEDIUM — контракт предлагал per-hook callback `isCurrentAccess` внутри общего queryFn. При совместном Query observer его closure мог принадлежать уже размонтированному потребителю и ложно отклонить общий результат. Исправлено в research/plan/contract: актуальность доступа обеспечивают `accessId` в query key и отмена TanStack Query, а после await остаются проверка сигнала и активной сессии. Второй проход: открытых CRITICAL/HIGH/MEDIUM/LOW — 0.

## Трассировка

| Требование | Задачи | Доказательство |
| --- | --- | --- |
| FR-001 | T001, T004–T006 | общий координатор |
| FR-002 | T003–T006 | один apply на queryFn |
| FR-003 | T001, T005–T006 | сообщение, временный чат, unread/issues |
| FR-004 | T003–T006 | read hook без QueryCache side effect |
| FR-005 | T001, T003–T006 | accessId, empty/error/refetch |
| FR-006 | T003–T006 | scope/chat/signal/session/late response |
| FR-007 | T001, T005–T006 | apply-before-ACK |
| FR-008 | T003–T006 | unknown/recovery history refetch |
| SC-001 | T003–T007 | cache-write probe и Query test |
| SC-002 | T003–T007 | controlled integration и Query/E2E |
| SC-003 | T001, T005–T007 | notification/send/recovery regression |

C1–C8 PASS: варианты, риск и границы названы; 043 отделена от 042/049; пользовательская авторизация реализации и исключение commit/push учтены; пакетов и реальных данных нет; 29/29 integration baseline подтверждены; новый случай дублированного apply идёт через Red → Green; выбран минимум новых abstractions. 8 FR, 3 SC, 7 задач; покрытие 11/11; задач без требования 0, существенных неоднозначностей и дублей после исправления 0. Новый Query Red/Green, интеграционный тест, полная регрессия и CI пока NotRun; результаты будут в verification.md.
## Повторный read-only анализ после реализации

Прочитаны 17 файлов комплекта, координатора, hook, adapters и тестов. SHA-256 до/после `c33bc2ebe51dd85132a3002db89afc8ffd9b2dea1121a87ba37222cb307136eb`, unchanged=true; открытых findings 0. В `useChatHistory` больше нет `useLayoutEffect`, `dataUpdateCount` и подписки QueryCache для бизнес-применения. Один queryFn применяет историю один раз; проекции accepted/delivery проходят через координатор, исходные cache adapters сохранены. Фактические проверки приведены в verification.md.