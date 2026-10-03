# Проверка реализации 029

Дата: 2026-10-03. Ветка: refactor. Исходный HEAD: a51711d2e3e653a3b59ce17bcc44dc64c18e77bc. Node 24.14.1, npm 11.11.0, Windows/PowerShell 7.6.5. При начале работы Git был чистым. Пользователь разрешил этому чату код/проверки/локальный commit и отдельно установку восьми тестовых devDependencies.

## Реализовано

Vitest 5 с явным ESM-конфигом и проектами node/dom; команды run/project/watch/typecheck; RTL, user-event, jsdom 29.1.1 и CSS Modules через существующий Sass. Setup удаляет DOM, возвращает настоящие таймеры; штатные настройки Vitest восстанавливают spies/stubs и сбрасывают mocks. Фабрика QueryClient создаёт кеш на тест и очищает/отменяет запросы при завершении.

B028-I-0240/0241 перенесены без изменения fixtures/assertions, кроме импорта runner. Старый файл удалён только после успешного исходного и нового запуска. B028-E-0100 сохранён полностью; DOM-пилот дополнительно проверяет отображение и вызов действия компонента. Из семи Vitest-проверок три относятся к поведению пилота, четыре — к тестовому окружению. Их нельзя считать семью новыми продуктовыми сценариями.

## Фактические проверки

Все команды ниже выполнены в проекте; время UTC. Статус приёмки каждой строки Passed, включая три намеренно нарушающих примера с ожидаемым exit 1. Это проверка конфигурации, не Red/Green новой бизнес-логики.

| Команда                                                                                                                                                                                                                            | UTC               | Exit | Доказательство                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---- | ------------------------------------------------------------ |
| `npm run test:integration -- tests/integration/recipient-label.spec.ts`                                                                                                                                                            | 08:56:33–08:56:35 | 0    | 2/2 до переноса                                              |
| `npm install --save-dev --save-exact vitest@5.0.3 vite@8.3.2 @vitejs/plugin-react@6.1.1 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1 jsdom@29.1.1` | 08:56:48–08:57:12 | 0    | 8 прямых devDependencies; версии и peers подтверждены npm ls |
| `npm run test:unit`                                                                                                                                                                                                                | 09:02:00–09:02:01 | 0    | 4/4, без DOM                                                 |
| `npm run test:component`                                                                                                                                                                                                           | 09:02:01–09:02:03 | 0    | 3/3, DOM/QueryClient очистка                                 |
| `npm test -- tests/unit/recipient-label.test.ts -t "normalized submitted username"`                                                                                                                                                | 09:02:04–09:02:05 | 0    | 1 passed, 1 skipped по явному фильтру                        |
| `npm run typecheck:tests`                                                                                                                                                                                                          | 09:02:05–09:02:07 | 0    | новые tests/setup/config/support типизируются                |
| `npm test -- tests/unit/recipient-label.test.ts`                                                                                                                                                                                   | 09:02:07–09:02:08 | 1    | ожидаемый assertion failure: @demo_user ≠ @wrong_user        |
| `npm test`                                                                                                                                                                                                                         | 09:02:09–09:02:11 | 0    | 7/7 после восстановления ожидания                            |
| `npm run test:integration`                                                                                                                                                                                                         | 09:03:51–09:04:21 | 0    | 351/351; ещё 2 прежних сценария перенесены в Vitest          |
| `npm run test:query -- --list`                                                                                                                                                                                                     | 09:04:45–09:04:46 | 0    | 45 сценариев; только discovery, не выполнение                |
| `npm run test:e2e -- --list`                                                                                                                                                                                                       | 09:04:47–09:04:48 | 0    | 109 сценариев; только discovery, не выполнение               |
| `npm run test:e2e -- tests/e2e/recipient-search-ui.spec.ts`                                                                                                                                                                        | 09:04:48–09:04:59 | 0    | 1/1 B028-E-0100; production build также прошёл               |
| `npm run typecheck`                                                                                                                                                                                                                | 09:04:22–09:04:26 | 0    | Next typegen и корневой TypeScript                           |
| `npm run lint`                                                                                                                                                                                                                     | 09:05:57–09:06:02 | 0    | 0 ошибок и предупреждений                                    |
| `npm run lint:styles`                                                                                                                                                                                                              | 09:06:03–09:06:04 | 0    | успешно                                                      |
| `npm run format:check`                                                                                                                                                                                                             | 09:06:04–09:06:07 | 0    | успешно                                                      |
| `npm test`                                                                                                                                                                                                                         | 09:06:07–09:06:10 | 0    | 7/7 после предкоммитных правок                               |
| `'export const value: any = 1' \| node node_modules/eslint/bin/eslint.js --stdin --stdin-filename vitest.config.mts`                                                                                                               | 09:07:11–09:07:12 | 1    | ожидаемое нарушение no-explicit-any, exit 1                  |
| `'export const value: number = 1' \| node node_modules/eslint/bin/eslint.js --stdin --stdin-filename vitest.config.mts`                                                                                                            | 09:07:13–09:07:14 | 0    | допустимый TypeScript .mts принят                            |
| `npm test -- --project node no-such-test`                                                                                                                                                                                          | 09:07:15–09:07:16 | 1    | ожидаемая ошибка No test files found, exit 1                 |

| `npm test` | 09:11:20–09:11:22 | 0 | Passed после финальной правки проверки таймеров |
| `node node_modules/eslint/bin/eslint.js tests/unit/environment.test.ts --max-warnings=0` | 09:11:22–09:11:24 | 0 | Passed после финальной правки проверки таймеров |
| `npm run typecheck:tests` | 09:11:24–09:11:26 | 0 | Passed после финальной правки проверки таймеров |

Watch: `npm run test:watch` запущен с явным --watch, 7/7 passed, перешёл в Waiting for file changes. Сохранение неизменённого unit-файла вызвало RERUN и 2/2 passed в 09:02:46 UTC; q завершил процесс с exit 0.

Нарушенный пример восстановлен: текущий unit-тест ожидает @demo_user, @wrong_user отсутствует. TypeScript и lint замечания исправлены; итоговые команды выше выполнены после соответствующих исправлений.

## Соответствие FR/SC

| Элемент | Доказательство                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------- |
| FR-001  | Восемь точных devDependencies, совместимые engines, package-lock от npm                             |
| FR-002  | node/dom проекты; Node без document/window; RTL render работает с development React                 |
| FR-003  | Полный/отдельный/отфильтрованный/watch запуск; ненулевые выходы проверены                           |
| FR-004  | Алиас и SCSS импортируются; проверки восстановления DOM/mocks/fetch/env/timers/QueryClient проходят |
| FR-005  | Два прежних label-сценария и DOM-сценарий RecipientSearchResult                                     |
| FR-006  | Integration 351 + перенесённые 2; query 45 и E2E 109 сохранены; целевой E2E Passed                  |
| FR-007  | @wrong_user вызвал нужный assertion failure; восстановление 7/7                                     |
| SC-001  | Отдельно Node 4/4, DOM 3/3 и вместе 7/7 без Next-сервера                                            |
| SC-002  | Повторные запуски и cleanup-контракты Passed; browser coverage сохранено                            |
| SC-003  | Контролируемое падение и восстановленный набор подтверждены                                         |

## Предкоммитное ревью

- src/, Playwright config, query/E2E-тесты и общие AGENTS/GIT_POLICY не изменены.
- Пилот unit совпадает с прежним тестом с точностью до импорта Vitest. Карта IDs — [migration-map.md](migration-map.md).
- Конфиг .mts имеет явный ESM без изменения package type; ESLint применяет существующие правила к .mts, что проверено положительным и отрицательным примерами.
- DOM-тест использует доступные роли/независимые тексты, user-event и callback. Нет привязки к SVG, generated class или геометрии jsdom.
- Таймер проверяется независимым флагом исполнения: reset моков не может скрыть ошибочное выполнение callback при teardown.
- Историческая ссылка из inventory 028 ведёт на исходный commit; старые ID и counts сохранены.
- Последовательные пары допускаются только для проверки teardown самого runtime. Общий QueryClient для продуктовых тестов не введён.
- В lockfile добавлена тестовая цепочка; единственная изменившаяся версия прежнего пакета — dev-зависимость @csstools/css-calc 3.4.2 → 3.4.3. Прямые runtime dependencies неизменны.
- Итоговый read-only анализ завершён: замечаний к реализации 029 нет, список/хеши 780 путей неизменны. Сверка 14 документов, 210 ссылок, lockfile и эквивалентности пилота успешна. Сырые логи и одноразовые инструменты в commit не включаются.

## Ограничения и непроведённые проверки

Полные query/E2E-наборы в 029 повторно не выполнялись: исходники и эти тесты сохранены; выполнены discovery и целевой production E2E. Полный baseline 028 остаётся историческим результатом. DEFECT-01 фокуса не исправлен и не объявляется закрытым. Настоящий StrictMode replay относится к 030; наличие development React само по себе его не доказывает. GitHub CI и чистая установка на другой машине — NotRun.

npm audit: Failed — 12 high записей в существующей dev-цепочке braces/ESLint/Stylelint. Проверка исходного lockfile через npm audit --package-lock-only дала те же 12 имён и те же количества; новые библиотеки не добавили записей. Автоматический audit fix/понижение ESLint не выполнялись. Это отдельная существующая проблема зависимостей, требующая решения вне 029.

## Комплект и фиксация

[Spec](spec.md), [checklist](checklists/requirements.md), [research](research.md), [plan](plan.md), [data-model](data-model.md), [runtime contract](contracts/test-runtime.md), [quickstart](quickstart.md), [tasks](tasks.md), [analysis](analysis.md), [migration map](migration-map.md).

Локальный commit разрешён; название: `chore: add Vitest and React Testing Library foundation`. На момент записи отчёта commit ещё не создан; T010 подтверждается фактическим Git hash/составом/status в ответе. Следующая задача — 030; весь R01 пока не завершён.
