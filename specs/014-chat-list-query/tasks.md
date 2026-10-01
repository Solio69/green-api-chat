# Tasks: список личных чатов и TanStack Query

**Input**: [spec.md](spec.md), [plan.md](plan.md), research/model/contracts/quickstart.
**Статус**: реализация разрешена 2026-10-01 и завершена 2026-10-02. Соседний чат завершил текущую работу до кода. Query 5.104.0 установлена пользователем. T001–T012 выполнены; результаты — verification.md, read-only итог — analysis.md. Видимый список остаётся в 015.
Пути относительно корня проекта. Работа строго последовательная. Фактические результаты отмечены ниже и в verification.md; ручной реальный GetChats остаётся NotRun.

## Phase 1 — Разрешение, окружение и готовность тестов

- [x] T001 [US3] Зафиксировать разрешение реализации в specs/014-chat-list-query/{spec,plan,tasks}.md; повторно прочитать diff и общие src/app/page.tsx, src/components/LogoutButton/LogoutButton.tsx, src/lib/{routes,api,http,green-api}/constants.ts, package.json, eslint.config.mjs, tests/e2e/fixtures/fake-green-api.ts, docs/{project-overview,chat-ui-spec}.md. Сверить принадлежность и очередность по contracts/ui-integration.md; сохранить весь текущий пользовательский UI/staging. Результат: нет конфликта записи; иначе Blocked затронутой точки, независимые чтения возможны. Зависимость: разрешение пользователя. FR-016, SC-006.
- [x] T002 Проверка операторской установки @tanstack/react-query 5.104.0 в package.json/package-lock.json/node_modules и peer совместимости; команду установки выполняет пользователь по quickstart.md. Результат: точная зависимость доступна без новых test packages; при отсутствии Blocked. Зависимость: T001. FR-015, SC-005.
- [x] T003 Создать конфигурацию тестов playwright.query.config.ts и tests/fixtures/query-app/{package.json,tsconfig.json,next.config.ts,app/layout.tsx,app/page.tsx,app/login/page.tsx,components/QueryProbe/QueryProbe.tsx,components/QueryProbe/index.ts}; добавить test:query в package.json, узкий generated-output ignore в eslint.config.mjs. Подготовить tests/chats/{constants,helpers}.ts, tests/e2e/fixtures/chats-scenarios.json и getChats ветку tests/e2e/fixtures/fake-green-api.ts. Новые runtime файлы plan Project Structure допустимо создать только как компилируемые заглушки контрактных экспортов и controlled unsuccessful route; не реализовать получение/нормализацию/кэш/очистку и не подключать production page. Проверить fixture сборку/поднятие, typecheck и fake route без обращения к реальному API; эта проверка не Red. Зависимость: T002. FR-014–FR-016, SC-005–SC-006.

## Phase 2 — Постоянные тесты и поведенческий Red

- [x] T004 [US1–US3] Написать tests/integration/chats-api.spec.ts (normalization, adapter, handler, HMAC/session/scope), tests/integration/chat-query.spec.ts (fetch/query/lifecycle), tests/e2e/chats-api.spec.ts (реальный route/cookie), tests/query/chat-query.spec.ts (публичный React hook/provider/LogoutButton). Покрыть все проверки contracts/chats-api.md и contracts/query-layer.md: mixed/empty/malformed/dedup/no-secrets; no-provider без session/scope и для OPTIONS/POST, HEAD без тела; error/429/deadline/abort; query dedup/freshness/gc/refresh; logout success/failure; late result, одинаковый chatId А/Б, scope mismatch, 401/409 one transition; nullable context и StrictMode replay. Запустить три адресных команды quickstart TDD и записать в specs/014-chat-list-query/verification.md команды, инфраструктурный успех и конкретный ожидаемый поведенческий Red. Заглушки должны компилироваться; test assertion об отсутствующей реализации, а не failed import, разрешает следующий этап. Red подтверждается один раз до всей серии реализации; тесты сохраняются. Зависимость: T003 и успешная инфраструктура. FR-001–FR-015, SC-001–SC-005.

## Phase 3 — Реализация после Red

- [x] T005 [US1] Реализовать src/lib/chats/{types,constants,normalize-chats}.ts, src/lib/green-api/get-chats.ts и CHATS_METHOD в src/lib/green-api/constants.ts. Строгий allowlist, user-only, first duplicate, реальные optional подписи; deadline10s, одна 429 retry, сигнальная отмена, безопасная классификация без лишнего state вызова. Результат: поведение соответствует model/API contract. Зависимость: подтверждённый T004 Red. FR-001, FR-003–FR-006, SC-001–SC-002.
- [x] T006 [US1, US3] Реализовать src/lib/auth/get-query-scope.ts, src/lib/chats/handle-chats-request.ts, src/app/api/chats/route.ts; добавить CHATS_API, CONNECTION_CHANGED, header scope в src/lib/{routes,api,http}/constants.ts. Cookie/config/scope проверяются до upstream, верные статусы/no-store/clearSession, фиктивный независимый HMAC vector совпадает. Результат: реальный HTTP контракт без браузерных credentials. Зависимость: T005 (и T004 Red). FR-001–FR-006, FR-011, FR-013, SC-001–SC-002, SC-004–SC-005.
- [x] T007 [US2, US3] Реализовать src/lib/chats/fetch-chats.ts, src/lib/query/create-query-session.ts, src/components/QueryProvider/{QueryProvider.tsx,index.ts}, src/lib/chats/use-chats.ts. Один клиент на scope/lifecycle, signal и late guards, safe JSON validation, однозначные pending/refresh/error; explicit cache policy; закрытие скрывает data, cancel/clear необратимы; error transition однократен; StrictMode replay не закрывает живой context. Результат: публичный hook соответствует contracts/query-layer.md без копии query state/store/persistence. Зависимость: T006 (и T004 Red). FR-005, FR-007–FR-012, FR-015, SC-001, SC-003–SC-005.
- [x] T008 [US3] Минимально изменить актуальный src/app/page.tsx для provider/key/scope authorized ветки и src/components/LogoutButton/LogoutButton.tsx для nullable close после HTTP ok, до навигации. Retry вне provider, server profile, native logout form, login/search остаются рабочими. Повторно сверить общие файлы перед записью, сохранить каркас соседней работы. Результат: реальный lifecycle интегрирован, стили/список UI не добавлены. Зависимость: T007 и отсутствие конфликта shared области. FR-010–FR-011, FR-013–FR-016, SC-004–SC-006.

## Phase 4 — Green, Refactor и итоговая приёмка

- [x] T009 [US1–US3] После завершения T005–T008 запустить адресные integration/query/e2e команды quickstart; получить Green всех сохраняемых тестов T004. Зафиксировать фактические результаты в specs/014-chat-list-query/verification.md. При fail исправить причину в рамках контракта и повторить затронутые проверки; не заявлять Green по части набора. Зависимость: T008. FR-001–FR-015, SC-001–SC-005.
- [x] T010 Провести Refactor затронутых файлов из T005–T008 только после Green: убрать дубли/небезопасные assertions, сверить компоненты/именованные параметры/контекст lifecycle и не вводить универсальный API слой. Перечень будущих runtime файлов не расширять без актуализации plan/tasks. Результат: семантика сохранена, изменения видимы в diff. Зависимость: T009. FR-007, FR-010–FR-016, SC-003–SC-006.
- [x] T011 [US1–US3] Итоговый набор quickstart: root и fixture typecheck, lint, styles, format, полный integration, query browser и основной E2E (включая login/profile/search/logout). Browser runners подтверждают обе production сборки. Проверить узкий eslint ignore на generated output и исходнике. Выполнить предкоммитное read-only ревью scope/secrets/late cleanup/shared diff/соответствия spec; результаты и ограничения записать в specs/014-chat-list-query/verification.md. Ручной реальный GetChats предложить пользователю, отсутствие результата отметить NotRun. Зависимость: T010. FR-001–FR-016, SC-001–SC-006.
- [x] T012 Обновить specs/014-chat-list-query/{spec,plan,tasks,verification}.md и checklists/acceptance.md по фактам; технические изменения вернуть в соответствующие contracts/research/model/quickstart и повторить read-only анализ с сохранением analysis.md после прохода. Минимально обновить docs/project-overview.md и docs/chat-ui-spec.md с фактическим статусом API/hook, сохранить соседние изменения; подтвердить contracts/ui-integration.md для UI-потребителя. Отчёт: что готово, тесты/риски/NotRun, UI интегрирован или ожидает, следующий шаг history/UI, команды и предлагаемое feat: add personal chat queries with isolated cache. Git staging/commit/push не выполнять. Зависимость: T011. FR-008, FR-013–FR-016, SC-005–SC-006.

## Dependencies & Execution Order

T001 → T002 → T003 → T004 (поведенческий Red) → T005 → T006 → T007 → T008 → T009 (Green) → T010 (Refactor) → T011 → T012. Внутри T003 проверки конфигурации последовательные. Нет параллельных маркеров. T005–T008 запрещены при только infrastructure failures T004. T009 не заменяет Red задним числом. T011 после refactor проверяет итог, не дублирует отдельную build сверх runner без причины.

## Coverage

| Требование/критерий | Задачи                                                     |
| ------------------- | ---------------------------------------------------------- |
| FR-001              | T004, T005, T006, T009, T011                               |
| FR-002              | T004, T006, T009, T011                                     |
| FR-003              | T004, T005, T009, T011                                     |
| FR-004              | T004, T005, T006, T009, T011                               |
| FR-005              | T004, T005, T007, T009, T011                               |
| FR-006              | T004, T005, T006, T009, T011                               |
| FR-007              | T004, T007, T009, T010, T011                               |
| FR-008              | T004, T007, T009, T011, T012                               |
| FR-009              | T004, T007, T009, T011                                     |
| FR-010              | T004, T007, T008, T009, T010, T011                         |
| FR-011              | T004, T006, T007, T008, T009, T010, T011                   |
| FR-012              | T004, T007, T009, T010, T011                               |
| FR-013              | T006, T008, T009, T010, T011, T012                         |
| FR-014              | T003, T008, T010, T011, T012                               |
| FR-015              | T002, T003, T004, T007, T008, T009, T010, T011, T012       |
| FR-016              | T001, T003, T008, T010, T011, T012                         |
| SC-001              | T004, T005, T006, T007, T009, T011                         |
| SC-002              | T004, T005, T006, T009, T011                               |
| SC-003              | T004, T007, T009, T010, T011                               |
| SC-004              | T004, T006, T007, T008, T009, T010, T011                   |
| SC-005              | T002, T003, T004, T006, T007, T008, T009, T010, T011, T012 |
| SC-006              | T001, T003, T008, T010, T011, T012                         |

Каждая задача связана с требованием; общая инфраструктура T003 нужна для проверяемости FR-008/015 и отделения от редизайна. T001/T012 процессные, обоснованы FR-016 и обязательными gate/verification; сирот нет. Покрытие плана не означает исполненное покрытие тестами.

## Completion

Все T-ID закрываются только по проверенному результату. FR/SC сопоставлены контрактам и постоянным тестам. verification содержит команды/причины Red, Green, финальные проверки и реальные ограничения. Checklist acceptance отмечается по фактам, анализ документов не выдаётся за реализацию. Настоящая ручная проверка может оставаться NotRun с явным указанием; продуктовый UI — отдельный статус и задача.

## Operator-only actions

Проверка registry и установка Query/при необходимости браузера — пользователь. БД, миграции, публикация отсутствуют. Git действия — только по GIT_POLICY.md и отдельной явной авторизации. T001–T012 завершены без установки пакетов агентом и без Git mutations.
