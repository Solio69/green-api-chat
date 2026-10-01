# Implementation Plan: список личных чатов и TanStack Query

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-02. Реализация завершена, проверки Passed; реальные результаты — verification.md.
**Согласование spec.md**: «Согласовано. дело весь комплект.»
**Разрешение на реализацию**: Получено 2026-10-01; пользователь требует дождаться завершения чата «каркас чата и редизайн поиска» и сверить итоговые изменения перед кодом. Установка зависимости выполняется пользователем.

## Summary

Серверный GetChats → GET /api/chats → useChats в scoped QueryProvider. Только личные чаты, нормализованные данные, общий временный кэш и явные состояния. Профиль/вход/поиск сохраняют прежнюю архитектуру. Список в продуктовый интерфейс подключает отдельная задача UI.

Один QueryClient на подключение, ключ ['chats', opaque connectionScope], свежесть 60 секунд, gc неактивного результата 300 секунд; logout/401/смена контекста закрывают кэш и отменяют запросы. Для привязки к cookie scope вычисляется сервером через HMAC существующей сессии, без новой БД или изменения cookie. История, отправка, уведомления и persistence вне объёма.

## Considered Options

| Вариант                              | Преимущества              | Ограничения и риски                              | Выбор и причина          |
| ------------------------------------ | ------------------------- | ------------------------------------------------ | ------------------------ |
| Query только для списка              | Общий запрос, малый объём | Нужно явно настроить выход                       | Выбран по договорённости |
| Перенос всех форм и профиля          | Общий стиль               | Лишняя клиентская копия профиля/смена контрактов | Отложен                  |
| Кэш на уровне компонентов/свой store | Без новой библиотеки      | Ручные гонки, дублирование и противоречие выбору | Не выбран                |
| Browser persistence/БД               | Дольше хранит результаты  | Пользователь исключил                            | Не применяется           |

Дополнительные альтернативы scope/SSR/тестов и основания: [research.md](research.md), R3–R6.

## Technical Context

Next.js 16.3.7 App Router, React 19.3.0, TS 5.9.3 strict, Node 24.x, npm 11.x, iron-session 9.0.1, Playwright 1.63.0. Новая единственная зависимость: @tanstack/react-query 5.104.0, установлена пользователем; exact версия/peer проверены, root и fixture production сборки Passed. Никаких новых тестовых пакетов. Память QueryClient, серверная зашифрованная HttpOnly cookie; без серверного общего кэша и persisted storage.

Существующие адаптеры и shared constants сохраняются, новая логика не требует общего рефакторинга. Новые собственные функции стрелочные с именованным объектом нескольких аргументов; unknown валидируется без маскирующего as. Компонент провайдера в собственной папке с index, без SCSS: он не создаёт визуальных элементов.

## Constitution Check

| Принцип                              | До проектирования | Основание                                                                      |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| C1 Участие пользователя              | PASS              | Варианты обсуждены; spec согласована, технические варианты предъявляются в kit |
| C2 Небольшая последовательная задача | PASS              | Только список и Query, без UI/истории; без параллельных задач                  |
| C3 Разрешения этапов                 | PASS              | Подготовка разрешена, код ожидает отдельный gate                               |
| C4 Git                               | PASS              | Только чтение Git; пользовательские staged изменения сохранены                 |
| C5 Установки/БД                      | PASS              | Установка оператором; БД нет                                                   |
| C6 Секреты/границы                   | PASS              | Серверные creds, safe DTO/scope, фиктивные тесты                               |
| C7 Проверки/TDD                      | PASS              | Явные Red→Green→Refactor и честные NotRun                                      |
| C8 Соразмерность                     | PASS              | Существующие инструменты, без лишних store/framework                           |

## Research and Design

- [clarify.md](clarify.md): все применимые категории Clear, новых вопросов 0; history/count вне шага.
- [research.md](research.md): проверенные внешние источники, альтернативы/риски, версия, SSR/cache/scope, тестовый host.
- [data-model.md](data-model.md): безопасный PersonalChat, нормализация, scope, состояния и ошибки.
- [contracts/chats-api.md](contracts/chats-api.md): request/response, session/scope, provider и ошибки.
- [contracts/query-layer.md](contracts/query-layer.md): provider/useChats, параметры, отмена и lifecycle.
- [contracts/ui-integration.md](contracts/ui-integration.md): границы совместной работы и будущий потребитель UI.
- [quickstart.md](quickstart.md): действия пользователя и команды проверок.
- [checklists/requirements.md](checklists/requirements.md): readiness spec; [checklists/acceptance.md](checklists/acceptance.md): будущая приёмка.
- [tasks.md](tasks.md): исполнимая последовательность; analysis.md записывается отдельно после read-only прохода.

Модель БД/миграции и отдельная спецификация дизайна неприменимы. verification.md появится после фактических проверок реализации, а не как фиктивный протокол Green.

## Project Structure

Полный планируемый перечень runtime/test/config/document изменений относительно корня. Файл с несколькими назначениями перечислен один раз. Детали исходных пользовательских файлов читаются повторно перед записью.

| Действие            | Файл                                                                                                                                                                                                                           | Причина                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Новый               | src/lib/auth/get-query-scope.ts                                                                                                                                                                                                | Серверная привязка к текущей сессии без секретов клиента                                               |
| Новые               | src/lib/chats/types.ts; src/lib/chats/constants.ts                                                                                                                                                                             | DTO, типы ошибок/результатов, доменные параметры ключа/кэша                                            |
| Новый               | src/lib/chats/normalize-chats.ts                                                                                                                                                                                               | Allowlist, типы, дубли, защита полей                                                                   |
| Новый               | src/lib/green-api/get-chats.ts                                                                                                                                                                                                 | GET адаптер, deadline/retry/classification                                                             |
| Новый               | src/lib/chats/handle-chats-request.ts                                                                                                                                                                                          | Чистый тестируемый HTTP обработчик с зависимостями объектом                                            |
| Новый               | src/app/api/chats/route.ts                                                                                                                                                                                                     | Next cookie/config и HTTP обработчик                                                                   |
| Новый               | src/lib/chats/fetch-chats.ts                                                                                                                                                                                                   | Клиентский fetch и валидация JSON/error/scope                                                          |
| Новый               | src/lib/query/create-query-session.ts                                                                                                                                                                                          | QueryClient/lifecycle, close/cancel/clear, подписка React                                              |
| Новые               | src/components/QueryProvider/QueryProvider.tsx; src/components/QueryProvider/index.ts                                                                                                                                          | Публичный headless provider и nullable внутренний context hook                                         |
| Новый               | src/lib/chats/use-chats.ts                                                                                                                                                                                                     | Публичный hook на useQuery, без копии data                                                             |
| Изменить            | src/app/page.tsx                                                                                                                                                                                                               | Scope/key/provider только authorized content, сохранять актуальный каркас                              |
| Изменить            | src/components/LogoutButton/LogoutButton.tsx                                                                                                                                                                                   | close после успешного logout, необязательный context                                                   |
| Изменить            | src/lib/green-api/constants.ts                                                                                                                                                                                                 | CHATS_METHOD рядом с существующими методами                                                            |
| Изменить            | src/lib/routes/constants.ts                                                                                                                                                                                                    | CHATS_API                                                                                              |
| Изменить            | src/lib/api/constants.ts                                                                                                                                                                                                       | CONNECTION_CHANGED                                                                                     |
| Изменить            | src/lib/http/constants.ts                                                                                                                                                                                                      | X-Connection-Scope в HTTP_HEADERS                                                                      |
| Изменить оператором | package.json; package-lock.json                                                                                                                                                                                                | Exact Query зависимость; отдельно агент добавляет test:query script в package.json                     |
| Изменить            | eslint.config.mjs                                                                                                                                                                                                              | Узкие исключения tests/fixtures/query-app/.next/** и generated next-env.d.ts; source остаётся под lint |
| Новые               | tests/chats/constants.ts; tests/chats/helpers.ts                                                                                                                                                                               | Фиктивные реквизиты/ответы и серверные cookie/helpers для E2E                                          |
| Новые               | tests/integration/chats-api.spec.ts; tests/integration/chat-query.spec.ts                                                                                                                                                      | Постоянное контрактное и cache/lifecycle покрытие                                                      |
| Новый               | tests/e2e/chats-api.spec.ts                                                                                                                                                                                                    | Реальный Next route/cookie и регрессия headless API                                                    |
| Изменить            | tests/e2e/fixtures/fake-green-api.ts                                                                                                                                                                                           | Изолированное расширение getChats без изменения прочих методов                                         |
| Новый               | tests/e2e/fixtures/chats-scenarios.json                                                                                                                                                                                        | Фиктивные сценарии поставщика                                                                          |
| Новый               | playwright.query.config.ts                                                                                                                                                                                                     | Browser runner fixture 3102, отдельные отчёты                                                          |
| Новый               | tests/query/chat-query.spec.ts                                                                                                                                                                                                 | Публичный hook/provider/выход в React браузере                                                         |
| Новые               | tests/fixtures/query-app/package.json; tests/fixtures/query-app/tsconfig.json; tests/fixtures/query-app/next.config.ts                                                                                                         | Minimal fixture на root dependencies, собственный .next, @/* на исходный src                           |
| Новые               | tests/fixtures/query-app/app/layout.tsx; tests/fixtures/query-app/app/page.tsx; tests/fixtures/query-app/app/login/page.tsx                                                                                                    | Только тестовый host, обычный и StrictMode mount, цель навигации logout                                |
| Новые               | tests/fixtures/query-app/components/QueryProbe/QueryProbe.tsx; tests/fixtures/query-app/components/QueryProbe/index.ts                                                                                                         | Два потребителя реального useChats, контролируемая смена scope и реальный LogoutButton                 |
| Изменить            | docs/project-overview.md; docs/chat-ui-spec.md                                                                                                                                                                                 | Фактический статус API/hook после проверок; совместная правка не перезаписывает UI                     |
| Новые/изменить      | specs/014-chat-list-query/spec.md; specs/014-chat-list-query/clarify.md; specs/014-chat-list-query/research.md; specs/014-chat-list-query/plan.md; specs/014-chat-list-query/data-model.md                                     | Документы решений и фактическое согласование                                                           |
| Новые               | specs/014-chat-list-query/contracts/chats-api.md; specs/014-chat-list-query/contracts/query-layer.md; specs/014-chat-list-query/contracts/ui-integration.md; specs/014-chat-list-query/quickstart.md                           | Контракты/команды                                                                                      |
| Новые/изменить      | specs/014-chat-list-query/tasks.md; specs/014-chat-list-query/analysis.md; specs/014-chat-list-query/checklists/requirements.md; specs/014-chat-list-query/checklists/acceptance.md; specs/014-chat-list-query/verification.md | Анализ, приёмка и реальные результаты этапов                                                           |

Не требуется изменение root layout, auth/session format, GetAccountSettings, login/search routes, существующих форм или SCSS. Generated next-env.d.ts/.next/tsbuildinfo/report не доставляемые исходники. Если нужен иной runtime файл/новый инструмент, сначала актуализировать перечень и проверить границы; не расширять молча.

## Tasks and Dependencies

Работа последовательна: gate пользователя → установка оператором/сверка shared files → тестовый host и компилируемые незавершённые точки контракта → постоянные тесты и один подтверждённый поведенческий Red всей новой логики → сервер/Query/выход → Green после серии правок → Refactor → итоговая регрессия/ревью/verification. Подробные зависимости T001–T012 в tasks.md.

Перед Red допустимы только минимальные компилируемые заглушки новых экспортов (например, controlled service_unavailable) и тестовая конфигурация; без реального запроса, нормализации, cache/lifecycle бизнеса и подключения в продуктовую главную. Import/package/fixture errors — Blocked, не Red. Проверки API ожидают реальные подготовленные данные/ноль calls/изменение cookie; Query тесты ожидают общее выполнение/очистку. Все тесты остаются после реализации.

## Verification

Интеграционные тесты на существующем Playwright runner проверяют normalization/provider/HTTP handler/scope и QueryObserver/lifecycle без настоящего аккаунта. Browser fixture проверяет настоящие публичные React exports и LogoutButton; prod E2E проверяет actual route/cookie с fake-green-api. Для HTTP E2E тестовый Node helper unsealData извлекает только фиктивную session, вычисляет scope; browser не получает credentials. Известный ожидаемый HMAC отдельно проверяется независимым test vector.

Команды и порядок — quickstart.md. После T004 Green не запускать после каждой строки: один набор после завершения серверной и клиентской серии, затем необходимый итоговый прогон после refactor. Перепроверка только после новых изменений/ошибок. Config: fixture build/typecheck/lint и запуск runner; изменённый ignore проверить на генерируемом output и исходнике с нарушением существующего правила.

Проверять cancellation during body/retry, inactive guards, UI скрытие данных closed контекста и StrictMode setup/cleanup/setup. Реальные секреты не вводятся автоматическими тестами. Невозможность registry/install/browser/server/build фиксируется Blocked с причиной. Ручное настоящее GetChats выполняет пользователь; непроведённое не считается Pass. Не заявлять готовность продуктового списка, когда готов только hook.

## Post-design Constitution Check

| Принцип | После проектирования | Основание                                                            |
| ------- | -------------------- | -------------------------------------------------------------------- |
| C1      | PASS                 | Решения и альтернативы доступны до кода; вопросов продукта 0         |
| C2      | PASS                 | 12 последовательных задач, единый объём                              |
| C3      | PASS                 | Gate кода остаётся; технический комплект не является реализацией     |
| C4      | PASS                 | Git только read-only, commit title — предложение                     |
| C5      | PASS                 | Registry/install операторские, без миграций                          |
| C6      | PASS                 | Cookie авторизует, scope только связывает, fixtures вымышленные      |
| C7      | PASS                 | Red прежде T005–T008, Green T009, Refactor T010, финальные T011–T012 |
| C8      | PASS                 | Минимальный scoped клиент, существующие тестовые инструменты         |

## Complexity Tracking

Отклонений от принципов нет. Scope/helper/заголовок необходимы для исключения записи чужого аккаунта при смене общей cookie, без серверной БД. Lifecycle необходим из-за поздних запросов/выхода; active не является копией query state. Fixture app добавляет время сборки, но позволяет проверить React слой без product test page и новых пакетов. BroadcastChannel, универсальный API SDK, suspense hydration, query profile/search, notification coordination и долгосрочное хранилище не добавляются.

Общий type guard неизвестного JSON-объекта — src/lib/api/is-record.ts; чистый рефакторинг и общая регрессия описаны в [017](../017-precommit-refactor/verification.md). Контракты и политика данных не меняются.
