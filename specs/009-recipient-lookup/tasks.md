# Tasks: E04.1 — поиск получателя в форме

**Input**: [spec.md](spec.md), [plan.md](plan.md), [контракт](contracts/recipient-search.md)

**Статус**: реализация, Red → Green → Refactor, автоматические проверки и предкоммитное ревью выполнены; ручная проверка реального инстанса ожидается.

Пути относительны корню проекта. Работа последовательная, без параллельной реализации.

## Phase 1 — проверяемый Red

Цель: поведенческий тест нового HTTP-маршрута и формы падает до продуктового кода при рабочем тестовом окружении.

- [x] **T001 [US1, US2, US3]** Проверить установленный `package.json` и baseline `tests/integration/login-route.spec.ts`, `tests/integration/get-state.spec.ts`. Подготовить `tests/e2e/fixtures/fake-green-api.ts`, локальный `tests/e2e/fixtures/package.json` для ESM, вымышленные сценарии в `tests/constants.ts`, `playwright.config.ts` с тестовыми `SESSION_PASSWORD` и `NODE_OPTIONS`. Подтвердить через текущую форму входа, что настоящая главная страница открывается после фиктивного `GetStateInstance: authorized`. Технический сбой стенда исправить до T002; результаты записаны в `verification.md`.
- [x] **T002 [US1, US2, US3]** Написать сохраняемый `tests/e2e/recipient-search.spec.ts` через настоящие HTTP-маршрут и главную страницу: поиск, режимы, найденный `chatId`, `exist: false`, исправление ввода, лимит, HTTP 401, временную ошибку, блокировку поля/режима/повтора, перезагрузку и отсутствие `SendMessage`. Запустить `npm run test:e2e -- --grep 'recipient search'` до продуктового кода. HTTP 404 нового маршрута и отсутствие формы — поведенческий Red; ошибки сборки, импорта или предзагрузки им не являются.
- [x] **T003 [US1, US2, US3]** После T002 Red, но до продуктового кода написать сохраняемые `tests/integration/check-account.spec.ts` и `tests/integration/recipient-search.spec.ts` с фиктивными реквизитами и независимыми ожиданиями из `tests/constants.ts`. Покрыть URL/POST/тело, оба режима, границы длины username (включая короткое имя и отказ после 32 символов до вызова провайдера), `exist: true/false`, неполный ответ, лимит внутри HTTP 200, HTTP 429/469, HTTP 401/403, сетевой сбой, неверный JSON/media type, отсутствие/истечение сессии и отсутствующий `SESSION_PASSWORD`. Их импорт до реализации не считается отдельным Red; первичный поведенческий Red уже подтверждён T002.

## Phase 2 — серверный поиск

Цель: один безопасный вызов `CheckAccount` на отправку формы.

- [x] **T004 [US1, US2, US3]** После T002 Red реализовать `src/lib/green-api/check-account.ts`, обновить `src/lib/green-api/constants.ts` и добавить `src/lib/recipients/constants.ts`, `validate-search.ts`, `resolve-search.ts`. Нормализовать вход и классифицировать ответы по `contracts/recipient-search.md`. Зависимые от маршрута интеграционные тесты будут запущены на Green после T005.
- [x] **T005 [US1, US2, US3]** После T004 использовать стандартное чтение JSON-тела, обновить `src/lib/http/constants.ts`, `src/lib/auth/handle-login-request.ts`, `src/lib/auth/constants.ts` и реализовать `src/lib/recipients/handle-search-request.ts`, `src/app/api/recipients/search/route.ts`. При необходимости дополнить `src/lib/api/constants.ts`, `src/lib/routes/constants.ts`. Проверять конфигурацию и сессию до тела, удалять cookie только при HTTP 401 провайдера, возвращать `no-store`. Получить Green интеграционных тестов и HTTP-части T002; проверить регрессию `login-route.spec.ts`, `session.spec.ts`.

## Phase 3 — форма

Цель: пользователь видит поиск и результат на защищённой главной странице.

- [x] **T006 [US1, US2, US3]** После T002 Red реализовать `src/components/RecipientSearchForm/RecipientSearchForm.tsx`, `RecipientSearchForm.module.scss`, `constants.ts`, `index.ts` и `src/components/RecipientSearchField/RecipientSearchField.tsx`, `RecipientSearchField.module.scss`, `index.ts`. Переиспользовать `SubmitButton`, объявлять обработчики до JSX, связать поле с ошибкой и показать безопасные состояния. Новые повторяемые стили и HTML-значения добавлять лишь при необходимости в `src/styles/_tokens.scss`, `_mixins.scss`, `src/lib/ui/constants.ts`.
- [x] **T007 [US1, US2, US3]** Подключить форму в `src/app/page.tsx`, сохранить `GetStateInstance`, retry и выход, убрать временный JSON. Получить Green всего `recipient-search.spec.ts`.
- [x] **T008 [US1, US2, US3]** Обновить устаревшее ожидание видимого JSON в `tests/e2e/login-flow.spec.ts` и формулировку `tests/integration/home-flow.spec.ts` без ослабления проверки входа. Проверить, что тесты входа/выхода продолжают соответствовать пользовательскому сценарию.

## Phase 4 — завершение

- [x] **T009 [US1, US2, US3]** После Green провести рефакторинг затронутых файлов по [CODE_STYLE.md](../../docs/CODE_STYLE.md) без изменения контракта: константы, компоненты с `index.ts`, именованные обработчики, SCSS-токены, доступность, отсутствие секретов. Повторить затронутые тесты одним прогоном.
- [x] **T010 [US1, US2, US3]** Выполнить итоговые `npm run test:integration`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, `npm run format:check` после остановки dev-сервера пользователем. `test:e2e` запускает `npm run build`; отдельно build запускать, только если E2E не состоялся. Проверить сценарии и границы spec, отсутствие секретов в ответах/логах и `SendMessage` в запросах, весь diff и `git diff --check`; разделить Passed/Failed/Blocked/NotRun.
- [x] **T011 [US1, US2, US3]** После проверок записать фактические команды, поведенческие причины Red и результаты Green/регрессии в `specs/009-recipient-lookup/verification.md`, обновить статусы tasks и связанные документы только по реализованному состоянию. Провести предкоммитное ревью, сообщить ограничения и следующие шаги, предложить английское название коммита; Git index/commit не менять.

## Dependencies & Execution Order

`T001 (рабочий стенд) → T002 (E2E-тест и поведенческий Red) → T003 (дополнительные тесты до кода) → T004 → T005 (сервер и Green) → T006 → T007 (UI и Green) → T008 (регрессия) → T009 (Refactor) → T010 (итоговая регрессия) → T011 (фактический отчёт)`. Каждый шаг последователен. Наличие файла теста без целевого падения не открывает реализацию. Ошибка импорта модульного теста не выдаётся за Red; техническая ошибка стенда исправляется до T002.

## Coverage

| Требование или критерий | Задачи          |
| ----------------------- | --------------- |
| FR-001, FR-002          | T002, T006–T008 |
| FR-003                  | T002–T007       |
| FR-004                  | T002–T005, T007 |
| FR-005                  | T002–T005       |
| FR-006                  | T002–T007       |
| FR-007                  | T002–T007       |
| FR-008                  | T002, T006–T007 |
| FR-009                  | T002, T004–T007 |
| FR-010                  | T001–T005, T010 |
| SC-001, SC-002, SC-003  | T002–T007       |
| SC-004                  | T002–T007       |
| SC-005                  | T002–T010       |

T001 нужен для достоверного baseline и браузерного теста без секретов, T009–T011 — для обязательного refactor, проверки и отчёта. Они обслуживают все истории, а не добавляют продуктовую функцию.

## Completion

Сверить поведение формы и серверного ответа с каждым FR/SC, проверить отсутствие `SendMessage`, сохранения чата и реальных реквизитов. `verification.md` содержит фактический Red/Green, итоговые проверки и ручной статус; непроведённое обозначается NotRun. После предкоммитного ревью пользователь получает команды следующего действия и предлагаемое имя коммита `feat: add recipient lookup form`; агент коммит не создаёт.

## Operator-only actions

Установка пакетов, миграции и изменение данных БД не нужны. Пользователь остановит свой dev-сервер перед production/E2E-проверками и выполнит реальный поиск на своём инстансе без публикации реквизитов. Git выполняется только по [GIT_POLICY.md](../../GIT_POLICY.md).
