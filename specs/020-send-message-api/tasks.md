# Tasks: серверная отправка текста

**Input**: [spec.md](spec.md), [plan.md](plan.md). **Дата**: 2026-10-02.
**Статус**: Completed / CodeAuthorized. Разрешены все задачи feature; используется общий runtime 022/023.
Пути относительны корню проекта; работа последовательная.

## Phase 1 — Границы и integration TDD

- [x] T001 [US1/US2] После разрешения прочитать актуальный diff и docs/CODING_RULES.md;
      сверить shared validator 018, runtime 022, HTTP proof 023 и тестовые fixtures.
      Сохранить preflight в specs/020-send-message-api/verification.md. Без готового
      guard использовать injected fake только для независимого handler теста;
      полный рабочий сценарий не объявлять готовым. Зависимость: отдельное разрешение
      после полного read-only analysis.md, без Git mutations.
- [x] T002 [US1/US2] Написать tests/integration/send-message.spec.ts:
      original text/4096 points/4097/UTF8 body/пустота/UUID/group aliases; accepted
      string id/no timestamp; отказ/429/5xx/timeout/lost malformed и zero retries;
      scope/owner/busy zero calls и finally lock settlement.
      Origin missing/null/invalid/foreign →403 invalid_request/not_sent; body reader
      не вызывается, lease/provider effects 0, cookie сохранена. Matching Origin
      проходит дальше к auth/body; эти assertions входят в Red T003, не только E2E.
      Отдельно проверить: release исключение после valid idMessage не теряет accepted
      и не меняет его на unknown; диагностические ошибки не раскрывают данные.
      Raw/encoded credentials в upstream idMessage дают unknown, не safe DTO;
      credential-containing request chatId отклоняется до provider вызова;
      message text сохраняется исходным и не подвергается этому фильтру.
      При нужде добавить type-compatible пустой adapter/handler каркас в пути plan после
      разрешения: import/build failure не Red. Зависимость: T001.
- [x] T003 [US1/US2] Запустить `npm run test:integration -- tests/integration/send-message.spec.ts`;
      записать поведенческий Red (assertion zero/one effects или wrong result), не
      ошибку окружения, в specs/020-send-message-api/verification.md. Зависимость: T002.
- [x] T004 [US1/US2] Только после подтверждённого T003 реализовать
      src/lib/sending/types.ts, constants.ts, read-send-body.ts,
      validate-send-request.ts, handle-send-request.ts и
      src/lib/green-api/send-message.ts; reuse shared validators/guard, one fetch,
      создать src/lib/green-api/safe-identifier.ts для безопасной проверки ID,
      exact outcome и original text. Обновить только необходимые constants plan.
      Зависимость: T003 = подтверждённый Red.
- [x] T005 [US1/US2] Повторить ту же integration команду; Green по всем assertions
      и сохранённым постоянным тестам, записать доказательства в verification.md.
      Зависимость: T004.

## Phase 2 — Реальный HTTP TDD

- [x] T006 [US1/US2] Написать tests/e2e/message-composer.spec.ts и фиктивные
      tests/e2e/fixtures/send-scenarios.json; расширить dispatch
      tests/e2e/fixtures/fake-green-api.ts без изменения прошлых сценариев.
      Cookie/scope/proof/stream/epoch, два запроса busy, expired/foreign proof,
      no-store/405/OPTIONS/413, malformed200 и cleanup failure — отдельные assertions.
      Browser matching Origin и прямые missing/null/foreign Origin запросы:
      403/not_sent и zero body/lease/provider effects, без cookie cleanup.
      Runtime claim/stream 022/023 должен быть готов либо HTTP интеграция Blocked.
      Зависимость: T005 и готовые 022/023.
- [x] T007 [US1/US2] Запустить `npm run test:e2e -- tests/e2e/message-composer.spec.ts`;
      проверить production интеграцию уже Red-tested handler/owner: отдельный
      production Red до wiring не фиксировался, это baseline/regression.
      Фактические основания и отклонение от первоначального порядка сохранены
      в verification.md. Ошибка Next/browser/fixture не считается Red. Зависимость: T006.
- [x] T008 [US1/US2] После Red ядра и T007 подключить src/app/api/messages/route.ts:
      cookie/scope/context, общие tryAcquireSend и adapter; добавить
      MESSAGES_API в src/lib/routes/constants.ts и только перечисленные plan
      shared error/status constants. Не менять UI/session semantics. Зависимость: T007.
- [x] T009 [US1/US2] Повторить exact E2E команду T007, получить Green и записать
      zero/one provider calls, методы и lock/handover исходы. Зависимость: T008.

## Phase 3 — Рефакторинг и завершение

- [x] T010 [US1/US2] Refactor новых src/lib/sending/* и send-message.ts по
      CODING_RULES, сохранив контракты. Проверить отсутствие raw/секретов, лишних
      getState/getChats и retry; выполнить integration+E2E из T003/T007 один раз
      после серии правок. Зависимость: T009.
- [x] T011 [US1/US2] Выполнить итоговый набор [quickstart](quickstart.md):
      integration, E2E send/chats/search, typecheck/lint и scoped format; отметить
      Acceptance checklists/acceptance.md Passed/Failed/Blocked только по результатам.
      Зависимость: T010.
- [x] T012 [US1/US2] Read-only предкоммитное ревью actual diff и FR/SC coverage;
      сохранить полный specs/020-send-message-api/verification.md с Red/Green/Refactor,
      командами/ограничениями/user actions. Показать результат и следующий отдельный
      шаг 021. Название коммита: `feat: add authenticated text message sending`;
      коммит/index не создавать. Зависимость: T011.

## Dependencies & Execution Order

T001 → T002 → T003 **поведенческий Red** → T004 → T005 **Green** → T006 →
T007 **HTTP Red** → T008 → T009 **Green** → T010 **Refactor** → T011 → T012.
Параллельной реализации и [P]-маркеров нет. Adapter/handler contract tests
не доказывают readiness полной owner-интеграции при незавершённой 022/023.
Временная отмена после dispatch не освобождает server lock раньше settlement;
этот assertion должен быть зелёным до объявления отправки готовой.

## Coverage

| Требование или критерий | Задачи                     |
| ----------------------- | -------------------------- |
| FR-001                  | T002–T005, T006–T009       |
| FR-002                  | T002–T005, T006–T009       |
| FR-003                  | T002–T005, T006–T009       |
| FR-004                  | T002–T005, T006–T009       |
| FR-005                  | T002–T005, T006–T012       |
| FR-006                  | T002–T005, T006–T010       |
| FR-007                  | T002–T005, T006–T012       |
| FR-008                  | T002–T005, T006–T009       |
| FR-009                  | T001, T008–T012            |
| FR-010                  | T002–T005, T006–T009       |
| SC-001                  | T003–T005, T007–T009, T011 |
| SC-002                  | T003–T005, T007–T009, T011 |
| SC-003                  | T003–T005, T007–T011       |
| SC-004                  | T003–T005, T007–T011       |
| SC-005                  | T003–T005, T007–T011       |

T001/T010–T012 также обязательны C6/C7/C8: контекст, доказательство TDD,
соответствие спекам и ревью. Acceptance status до кода — NotRun.

## Completion

Все FR/SC подтверждены, остаются постоянные тесты и полный verification.md.
Если нет working owner infrastructure, отметить HTTP связь Blocked, не считать
серверный модуль полной пользовательской отправкой. В текущем результате guard
и UI021 реализованы; прямое поручение охватывает весь комплект020–024.

## Operator-only actions

Установок, миграций и БД нет. Настоящая отправка и настройки инстанса — только
действия пользователя. Git — чтение по GIT_POLICY.md; staging только отдельным
прямым поручением с точными путями, commit/push агент не выполняет.

## Текущая авторизация

CodeAuthorized — все оставшиеся задачи до 024 реализованы по поручению 2026-10-02; HTTP маршрут использует общий runtime 022/023, UI подключён в 021.

## Фактический результат текущего шага

ВсеT001–T012 завершены:67 send baseline в общей регрессии342 integration,
30 Query и99 production E2E. HTTP/owner интеграция и Refactor/review выполнены. Доказательства:
[verification.md](verification.md).

## Результат реализации 2026-10-02

**Implementation Authorization**: CodeAuthorized. Прямое поручение пользователя:
«делай все эти задачи до 24 включительно. Интерфейс должен быть выполнен в
соответствии с макетом. Перед написанием кода прочитай правила написания кода
и код-стайл». Правила прочитаны до кода; согласованные продуктовые решения сохранены.
**Verification**: PassedSynthetic — автоматические серверные, React и production
проверки с фиктивным GREEN-API. Реальная операторская проверка: NotRun.
Полные доказательства, фактический TDD и ограничения: [verification](verification.md).
Итоговая согласованность: [analysis](analysis.md). Разрешение не включает удалённые
настройки, настоящие сообщения, установку пакетов или Git mutations.
