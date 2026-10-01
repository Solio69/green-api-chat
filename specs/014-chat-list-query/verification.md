# Verification: список личных чатов и TanStack Query

**Дата:** 2026-10-02. **Статус:** реализация 014 завершена; автоматическая приёмка Passed. Видимый список подключает отдельная задача 015. Получение реальных чатов подтверждено пользователем; полная ручная приёмка — NotRun.

## Авторизация и границы

Разрешение пользователя от 2026-10-01 сохраняется. Текущий turn соседнего чата «каркас чата и редизайн поиска» завершён с итоговым сообщением; актуальные shared файлы и diff прочитаны до записи. Query 5.104.0 установлен пользователем, exact package.json/lock/node_modules и peer React ^18 || ^19 проверены. Агент не устанавливал пакеты, не отправлял сообщений соседнему чату и не выполнял Git mutations.

Готовы GetChats, GET /api/chats, HMAC connectionScope, QueryProvider/useChats, закрытие кэша при успешном выходе и отказе сессии. Главная сохраняет ChatWorkspace, серверный профиль, поиск и retry; оформление не менялось. История, отправка и уведомления вне объёма.

## TDD: Red → Green → Refactor

Постоянные тесты написаны и запущены на компилируемых заглушках до реализации бизнес-логики. Production/fixture сборки и серверы успешно запустились; отсутствие поведения подтверждено assertions.

| Команда Red                                                                                                                                                         | Фактический результат | Причина поведенческого Red                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `node node_modules/@playwright/test/cli.js test --config playwright.integration.config.ts tests/integration/chats-api.spec.ts tests/integration/chat-query.spec.ts` | 36 Failed, 11 Passed  | Нет нормализации, scoped HTTP успеха/отказов, запроса Query, dedup и закрытия lifecycle |
| `node node_modules/@playwright/test/cli.js test --config playwright.query.config.ts`                                                                                | 8 Failed              | Нет клиентских запросов, data/empty, перехода после отказа сессии                       |
| `node node_modules/@playwright/test/cli.js test tests/e2e/chats-api.spec.ts`                                                                                        | 3 Failed, 1 Passed    | Заглушка отвечает 503 вместо 401/200, cookie не очищается при подтверждённом отказе     |

Некорректные формы уже отвергались заглушкой null, временная 503 уже совпадала с контрактом: исходные Passed не объявляются готовностью реализации. Ошибка Response.status() исправлена до повторного Red; ошибка компиляции не считалась Red.

После серии T005–T008 адресный Green: 47 integration, 8 query browser, 4 HTTP E2E — Passed. Браузерный селектор сообщения logout уточнён по тексту: общий role=alert совпадал также с Next route announcer. Это тестовая ошибка, не Red бизнес-логики.

Refactor сохранил поведение: именованные параметры ChatsQueryError, используемая константа имени ошибки, порядок импортов/форматирование; tracing root fixture ограничен корнем проекта. Дополнительные проверки deadline, ошибки cookie cleanup, отмены чтения JSON и тела поставщика, 409 и восстановления после reload являются регрессией существующей реализации; они не выдаются за исходный TDD Red. Оставшийся неиспользуемый scopeB assertion исправлен после fixture typecheck, инфраструктурный fail не считался Red.

## Итоговые проверки

| Проверка/команда                                                                                            | Результат                                                                                               |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                                                                         | Passed: Next typegen и root tsc                                                                         |
| `node node_modules/typescript/bin/tsc --noEmit --project tests/fixtures/query-app/tsconfig.json`            | Passed                                                                                                  |
| `npm run lint`                                                                                              | Passed, 0 warnings                                                                                      |
| `npm run lint:styles`                                                                                       | Passed                                                                                                  |
| `npm run format:check`                                                                                      | Passed                                                                                                  |
| `node node_modules/prettier/bin/prettier.cjs --ignore-path NUL --check "specs/014-chat-list-query/**/*.md"` | Passed                                                                                                  |
| `npm run test:integration`                                                                                  | Passed: 167 тестов, включая 51 проверку 014                                                             |
| `npm run test:query`                                                                                        | Passed: 9 Chromium тестов настоящего provider/hook/LogoutButton                                         |
| `npm run test:e2e`                                                                                          | Passed: 68 Chromium тестов, включая 4 HTTP проверки 014 и регрессию login/profile/search/logout/каркаса |
| Root production build/start внутри E2E runner                                                               | Passed, Next Turbopack, тестовый порт 3101                                                              |
| Fixture production build/start внутри Query runner                                                          | Passed, Next webpack, тестовый порт 3102                                                                |
| `git diff --check`                                                                                          | Passed                                                                                                  |
| Предкоммитное ревью shared diff, области, секретов и lifecycle                                              | Passed                                                                                                  |
| Read-only analyze, неизменность путей/SHA-256 до/после                                                      | Passed; полный отчёт в analysis.md                                                                      |

ESLint ignore проверен через установленный ESLint API, без новых инструментов: generated .next игнорируется (true); fixture source не игнорируется (false); запрещённый function declaration вызывает func-style; допустимая стрелочная функция имеет 0 ошибок. Файлы Next next-env.d.ts исключены отдельно. Короткие проверки находятся в scratch workspace, не в доставляемом проекте.

Две production сборки проверяют совместимость установленной зависимости с фактическим Next/React. Integration проверяет общий QueryObserver запрос, свежий remount, явную политику, refresh/retry, cancellation и scope. Browser проверяет два потребителя, pending/empty, stale remount/gc с clock, StrictMode replay, А→Б с одинаковым chatId, logout success/failure, 401/409 и одну refresh при 409. HTTP E2E проверяет настоящий route/HEAD/OPTIONS/POST/cookie с фиктивным API. Реальные реквизиты, переписка и сообщения не использовались.

## Сохранение изменений и ограничения

Git staging/commit/push не выполнялись. Shared page/LogoutButton/constants/fake API дополнены в границах 014; slots, оформление и пользовательский staging сохранены. Результаты соседних задач не подставляются вместо запусков 014. Dev-server пользователя не останавливался, его сессия не использовалась.

Кэш только в памяти текущего подключения: staleTime 60 секунд, gcTime 5 минут, retry false, без interval/focus запросов, stale reconnect разрешён. Закрытие скрывает данные синхронно, отменяет запросы и очищает QueryClient; поздний ответ не возвращает данные закрытого подключения.

Пользователь подтвердил получение реальных чатов. Полная ручная приёмка (смена аккаунта, ошибки, пустой список и выход) — NotRun. После подключения UI в 015 проверить собственный аккаунт обычным входом, без передачи реквизитов агенту. До этой интеграции главная показывает каркас, не обещает видимый список. GetChatHistory/notifications не реализованы. Мгновенная синхронизация вкладок отсутствует; scope защищает принадлежность данных при следующем запросе, не атомарность изменения общей cookie между вкладками.

Следующий шаг: 015 подключает useChats и презентацию списка по contracts/ui-integration.md. Отдельно обсуждается история. Возможное улучшение координации вкладок имеет смысл только при отдельном требовании; в 014 оно не добавлено. Автоматизация ожидания 014 остановлена (PAUSED).

Предлагаемое название коммита: `feat: add personal chat queries with isolated cache`. Коммит не создан.
