# Analysis: 021-message-composer

**Дата**: 2026-10-03. **Этап**: итоговый анализ реализации, самостоятельного ревью и превью после Green.
**Implementation**: CodeAuthorized / Completed. **Acceptance**: PassedSynthetic.
**Итог**: функциональных разногласий spec/plan/tasks/contracts/source не осталось.
Реальный GREEN-API/ручное ревью/публикация: NotRun.

## Границы и read-only метод

Exact prerequisites -RequireTasks -IncludeTasks Passed; FEATURE_DIR точно
соответствует выбранной feature. Прочитаны spec, plan, tasks, research,
data-model, contracts, quickstart, readiness/acceptance и verification,
AGENTS/constitution/CODING_RULES/CODE_STYLE/GIT_POLICY, общий комплект и
актуальный source/test diff. Первоначальная авторизация020 core сохранена;
прямое поручение2026-10-02 разрешило все оставшиеся задачи до024 по макету.
Повторный approval gate не требовался.

Итоговый frozen inventory **668 файлов** до/после совпал по полному
списку и SHA-256 каждого файла. Digest: **66559D4310A33F5B2FE0FD33A50DA98C586F3118E3AAA1D34FE0B39C6BE01478**.
Исключены .git,node_modules,.next,playwright-report,test-results,coverage,out,
build,tsconfig.tsbuildinfo. Исходники, config, docs/specs, правила и scripts включены;
содержимое секретов не выводилось. Во время прохода проект не изменялся;
этот полный отчёт сохранён отдельным действием после сверки.

Самостоятельное ревью включает локальный composer hook/feedback, отсутствие цикла
Provider→Notice→Provider, semantic constants, error attributes/outline и стили
восстановления. Runtime graph61 reachable modules имеет0 cycles. Exact paths,
относительные ссылки и карты FR/SC→T-ID проверены. Для020–024:62 FR,29 SC и62/62
выполненные задачи; требований без покрытия, отсутствующих ссылок/путей —0.
Общая карта018–025 сохраняет прежние139 требований/критериев и100 задач.

Актуальный проход включает прямые правки ревью: форма без сдвига при pending, тонкая прокрутка, сохранение фокуса readonly поля, SEND_CONFIG.NETWORK_MODE и очистка тестов/фикстур от повторяемых строк/адресов. tests/protocol.constants.ts независим от production, ожидаемые контракты не подменены значениями приложения. Production regression подтверждает форму320/360/1280, обе темы, неизменную геометрию и pending/focus; React regression подтверждает delivered из истории после переключения без SSE. Новых FR, серверных контрактов, хранилищ и зависимостей нет. Содержимое index пользователь менял самостоятельно во время работы; агент не выполнял Git mutations.

## Findings и исправления

| ID            | Категория / важность | Место                                                                   | Суть и результат                                                                                                                                                                                          |
| ------------- | -------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H022-R01      | runtime / HIGH       | src/lib/notifications/receiver-registry.ts; notification-health.spec.ts | retrying запрещал reader продолжать backoff recovery. Исправлено: reader active отделён от Send health; новые actual registry+loop Receive/Delete Red2/Green5 и регрессия342 подтверждают восстановление. |
| D-MANIFEST-01 | consistency / MEDIUM | 020/022 plans/contracts; общий комплект                                 | Status normalizer022 фактически использует чистый safe-identifier из уже готового core020. Manifest/DAG уточнён: core020 до022, HTTP020 после022/023; обратной зависимости helper от Send route нет.      |
| D-STATUS-01   | consistency / LOW    | spec/plan/tasks/acceptance020–024, корневые docs                        | Устаревшие CodeNotAuthorized/Blocked/NotRun для кода заменены текущей авторизацией и фактическими результатами. Operator NotRun сохранён отдельно.                                                        |
| P-TDD-01      | process / наблюдение | verification020/021, tasks Phase3                                       | Отдельный production E2E Red до wiring не фиксировался. Документы отражают фактический Red на ядре/React и production regression; исторический порядок не выдаётся за первоначальный план.                |

| R-COMP-01 | maintainability / LOW | src/components/MessageComposer/use-message-composer.ts; MessageComposerFeedback | Разметка формы, редактор/обработчики и feedback имеют самостоятельные роли. Общий pending/owner и snapshot guards сохранены; компактная разметка MessageComposer. |
| R-A11Y-01 | accessibility / MEDIUM | src/components/MessageComposer/MessageComposer.tsx; MessageComposer.module.scss | Превышение4096 помечается aria-invalid и error outline; исправление текста снимает ошибку. Actual Red1 до исправления, Green30 и production проверки обеих тем. |
| R-PREVIEW-01 | presentation / LOW | MessageComposerFeedback.module.scss; src/styles/_mixins.scss | Действие проверки истории оформлено existing-token recovery-button;44px hit area, различимые pending/error и отсутствие overflow320/360/1280. |

Все функциональные/документные findings исправлены и проверены. Открытые
CRITICAL/HIGH/MEDIUM/LOW разногласия: **0/0/0/0**. P-TDD-01 — явно сохранённое
процессное отклонение, не задним числом восстановленный E2E Red. Требования
пользователя не менялись ради исправлений.

## Содержательное соответствие

FR-001/002/003/004/013: живой MessageSendProvider внутри SelectionProvider и снаружи conditional pane; одна useMutation(retry:false, networkMode:always, gcTime:0) плюс synchronous latch. Допустимый Enter/click вызывает один Send; Shift/IME/blank/over4096 — ноль. Исходные пробелы/переносы не меняются. До idMessage нет пузыря; поле своей pending попытки и новый Send заблокированы.

FR-005/006/007/008/009/010/011/012: snapshot содержит исходные target/scope/attempt/editor revision/selectionEpoch, proof закрыт внутри transport/controller. Switch/close очищает текущий editor; mobile back сохраняет selection. Pending A не очищает B, late accepted публикуется только в retained original owner context. Unknown сохраняет подходящий текст, history-first/manual warning без autoretry. Accepted/local chat сохраняется при GetChats gap, merge identity общий019. Nonowner не отправляет. SC-001–007 проверены controller, real React StrictMode/fixtures и production E2E. Layout43px/74px и статусы используют исходный макет на1280/360/320; снимки просмотрены.

Основные постоянные проверки: [message-send-controller](../../tests/integration/message-send-controller.spec.ts), [session-chat-facts](../../tests/integration/session-chat-facts.spec.ts), [notification-owner](../../tests/integration/notification-owner.spec.ts), [notification-safety](../../tests/integration/notification-safety.spec.ts);
[React messaging](../../tests/query/message-composer.spec.ts),
[production messaging](../../tests/e2e/message-composer.spec.ts).
Каркас/шапка/поиск/список/история сохранены; отдельные presenter/button/notice
имеют самостоятельные роли, source constants и SCSS tokens соответствуют правилам.

## Покрытие FR/SC → задачи

| Требование / критерий | Задачи                          | Фактический результат |
| --------------------- | ------------------------------- | --------------------- |
| FR-001                | T002–T005, T011–T014            | PassedSynthetic       |
| FR-002                | T006–T010, T011–T016            | PassedSynthetic       |
| FR-003                | T006–T010, T011–T014            | PassedSynthetic       |
| FR-004                | T006–T010, T011–T014            | PassedSynthetic       |
| FR-005                | T002–T010, T011–T014            | PassedSynthetic       |
| FR-006                | T006–T010, T011–T014            | PassedSynthetic       |
| FR-007                | T006–T010, T011–T014            | PassedSynthetic       |
| FR-008                | T002–T005, T006–T010, T011–T014 | PassedSynthetic       |
| FR-009                | T002–T010, T011–T014            | PassedSynthetic       |
| FR-010                | T006–T010, T011–T016            | PassedSynthetic       |
| FR-011                | T006–T010, T011–T016            | PassedSynthetic       |
| FR-012                | T002–T005, T006–T010, T011–T014 | PassedSynthetic       |
| FR-013                | T002–T005, T006–T010, T011–T014 | PassedSynthetic       |
| SC-001                | T003–T005, T007–T010, T012–T016 | PassedSynthetic       |
| SC-002                | T003–T005, T007–T010, T012–T014 | PassedSynthetic       |
| SC-003                | T007–T010, T012–T014            | PassedSynthetic       |
| SC-004                | T007–T010, T012–T014            | PassedSynthetic       |
| SC-005                | T003–T005, T007–T010, T012–T014 | PassedSynthetic       |
| SC-006                | T007–T010, T012–T016            | PassedSynthetic       |
| SC-007                | T003–T005, T007–T010, T012–T014 | PassedSynthetic       |

Покрытие означает сопоставление требований и проверенного поведения, не процент
покрытия строк. Завершающие verification/review задачи не подменяют бизнес assertions.
Процессные задачи preflight/acceptance/review обоснованы C3/C4/C6/C7/C8;
необоснованных задач без requirement/principle нет.

## Метрики

- FR: 13/13; SC: 7/7; карта coverage:100%.
- Tasks: 17/17 completed; повторяющихся определений T-ID:0.
- Неохваченных FR/SC:0; необоснованных tasks:0; открытых существенных неоднозначностей:0.
- Противоречивых shared DTO/policies:0 после исправления manifest/status/recovery.
- Повторные ссылочные owner/identity guards в contracts намеренные, не альтернативная политика.

## TDD, этапы и зависимости

Фактический Red/Green, причины падений и refactor подробно сохранены в
[verification](verification.md). Новая business logic получила поведенческие
Red, existing core019/024 — исходный Green перед refactor. Missing imports,
Sass/config/fixture ошибки не объявлялись Red. Production wiring020/021
проверено как регрессия уже Red-tested поведения; отдельный E2E Red не записывался.

Порядок фактических стадий:025→018→019 foundation→020 core→022→023→020 HTTP→021→024→019
совместная приёмка. Feature number не равен границе runtime import: чистые
safe-identifier/constants core020 повторно используются022/023 без Send route
dependency. MessageDTO/reducer/early facts/issues/overlay принадлежат019,
право владельца и очередь022, delivery/ACK/client023, Send API020, editor021,
presentation024. Source менялся последовательно, не параллельными агентами.

## C1–C8 и предкоммитное ревью

| Принцип | Результат / доказательство                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1      | PASS: согласованные ACK/one-tab/unknown/history10/оригинальный текст/макет сохранены.                                                                    |
| C2      | PASS: самостоятельные features и роли; shared core используется, конкурирующих stores/readers нет.                                                       |
| C3      | PASS: explicit feature prerequisites, spec approval и прямое CodeAuthorized до реализации.                                                               |
| C4      | PASS: Git только чтение; staging/user diff сохранён, commit/push/reset отсутствуют.                                                                      |
| C5      | PASS: существующие Node/npm/packages; без installs/DB/SetSettings/ClearQueue/real Send/Delete.                                                           |
| C6      | PASS: cookie credentials server-only, capability RAM/private headers, scope/epoch/Origin guards; fictitious fixtures.                                    |
| C7      | PASS поведения: подтверждённый server/React Red→Green, baseline before refactor, полная регрессия; отдельный E2E Red не фиксировался и отмечен P-TDD-01. |
| C8      | PASS: один Node registry/Query session, bounded partial facts/parser/pending delivery, без broker/persistence/горизонтальной инфраструктуры.             |

Дифф проверен по поведению/identity/секретам/поздним эффектам/макету, paths
существуют; относительные ссылки выбранного комплекта пройдены. Линтеры,
типы, formatter и git diff --check прошли. Никакие изменённые user files не откатывались.

## Findings текущего ревью

| ID          | Категория / важность   | Место                                                                                      | Результат                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-FORM-02   | presentation / MEDIUM  | MessageComposer.module.scss; MessageComposerFeedback.module.scss; src/styles/_tokens.scss  | Исправлено: однострочный текст помещается в43px поле; многострочный сохраняет тонкую прокрутку. Визуально скрытый status не меняет геометрию при pending.                                                                                                                                                                                           |
| R-FOCUS-02  | accessibility / MEDIUM | MessageComposer.tsx; tests/e2e/message-composer.spec.ts                                    | Исправлено: readonly/aria-busy сохраняют фокус при Enter и блокируют редактирование. До кода проверка получила1 Failed из-за disabled/inactive; окончательная регрессия99 Passed, включая3 ширины.                                                                                                                                                  |
| R-TEST-02   | maintainability / LOW  | tests/protocol.constants.ts; integration/query tests; notification-fixture; fake-green-api | Повторяемые строки протокола и адреса имеют семантические имена. Тестовые ожидаемые значения независимы от production; fixtures используют существующие API/HTTP/provider enums, внешние E2E fixtures имеют собственный независимый контракт. Pure refactor опирается на Green baseline;342/31/99 Passed.                                           |
| O-STATUS-02 | operator / NotRun      | реальные GetSettings/ReceiveNotification/GetChatHistory                                    | Причина задержки у пользователя не установлена. Вкладка localhost3000 находилась на login; текущие настройки и события недоступны. Synthetic delivered/read применяются в открытом чате, после close/open сохраняются; fresh history снимает accepted при подтверждённом delivered. Настройки не менялись, время появления галочки не выдумывается. |

Вне текущих исправлений: большая техническая плашка outgoing настроек ранее замечена пользователем; она не доказывает, что все настройки выключены, и не проверялась на реальном API. Удаление/новый дизайн этого предупреждения пользователь здесь не поручал. Этот отчёт не заявляет исправление или проверку реального сценария статусов.

## Проверки, ограничения и следующий шаг

Итоговая регрессия:342 integration,31 Query,99 production E2E (472 случая)
(включая Next production build/type validation) — Passed, exit0.
typecheck/lint/styles/source format и отдельный Markdown Prettier override NUL — Passed.
Production E2E включает проверку error outline обеих тем и снятия aria-invalid
при320/360/1280. Новая accessibility проверка получила настоящий Red1, затем Green;
pure refactor опирается на ранее успешный342/30/99 baseline. Неудачный color assertion
на fixture без глобальной темы и unused fixture не выдаются за поведенческий Red.
Итоговые браузерные наборы завершены последовательно.
Сценарии используют fictitious GREEN-API; физический screen reader/IME телефона,
реальные settings/messages и hosting proxy не проверялись. SSE требует одного
постоянного Node процесса; multiprocess/serverless/multi-instance не поддержаны.
History10+RAM/queueTTL не гарантируют полный replay; early facts1000/5min;
ACK не durable commit, unknown Send может дать дубль при ручном повторе.

Реализация завершена в разрешённом объёме. Следующее действие — ревью пользователя
и ручной реальный сценарий по README/quickstart; публикация отдельно E06.
English commit title: **feat: add text messaging with SSE notifications and delivery statuses**.
Результаты synthetic browser preview и найденные исправления:
[verification021](../021-message-composer/verification.md#ревью-компонентов-и-превью).
Визуальная форма/отправка43px сохранены по макету; recovery actions44px.
Git mutations агент не выполняет.
