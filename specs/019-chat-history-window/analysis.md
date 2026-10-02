# Analysis: история выбранного чата и кеш

**Дата**: 2026-10-02. **Этап**: итоговый read-only анализ разрешённой реализации019.
**Feature**: `D:\Pet-projects\green-api-chat\specs\019-chat-history-window`.
**Результат**: Passed isolated, неустранённых findings нет. T011/SC-005 — NotRunExternal.
**Авторизация**: spec и код согласованы пользователем2026-10-02; отображение строго по макету.

## Границы и доказательство read-only

check-prerequisites.ps1 выполнен с -Json -RequireTasks -IncludeTasks и
-ExpectedFeatureDirectory, SPECIFY_FEATURE_DIRECTORY явно установлен для019.
FEATURE_DIR точно совпал с ожидаемым абсолютным путём.

В памяти сохранены полный список путей и SHA-256 до/после прохода. Списки
568 файлов и все хеши совпали. Общий digest до/после:

`BD9A3D5A5D4C5D699020AEE739CEB0A0B95776575090937F562A36FE94015A90`

Исключены .git, node_modules, .next, playwright-report, test-results, coverage,
out, build и tsconfig.tsbuildinfo: Git-метаданные, зависимости и генерируемые
выходы проверок. Между снимками не выполнялись записи, тесты, сборки,
форматирование или отметки задач. Этот полный отчёт сохранён отдельно ПОСЛЕ
прохода; запись отчёта не выдаётся за часть read-only анализа.

52 файла пользовательского README и будущих020–024 сверены по SHA с полным
предреализационным снимком: изменений нет. В023 изменены только plan/tasks и
contracts/notification-client.md: будущий recovery подключается к существующему
ChatHistoryPanel вместо удалённого отладочного Controller. Код023 не написан.
Git diff/index читались; index пуст. Git mutations не выполнялись.
Исторические analysis018/025/023 не перезаписывались; перед кодом023 требуется
его собственный актуальный анализ по обычному workflow.

## Проверенные документы

| Файл                              | Что проверено                                                                     | Результат                       |
| --------------------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| spec.md                           | US1/US2, acceptance, края, FR12/SC6, границы и авторизация                        | Passed                          |
| plan.md                           | Решения, manifest исходников/tests/docs, dependencies, TDD и C1–C8                | Passed                          |
| tasks.md                          | T001–T014, порядок Red→Green→Refactor, покрытие и условный T011                   | Passed;13 checked/1 external    |
| research.md                       | Существующий стек/Query, retention, источники, макет и ограничение редактирований | Passed                          |
| data-model.md                     | Разделение snapshot/merged/early/issues/overlay, lifecycle и метаданные           | Passed                          |
| contracts/message-cache.md        | DTO, identity, immutable sync merge, статусы/TTL/GC/issues и публичные signatures | Passed isolated                 |
| contracts/session-chat-overlay.md | PersonalChat/label отдельно, pending/provider union и reconcile                   | Passed isolated                 |
| contracts/history-view.md         | Slot025, состояния, time/text/unsupported, scroll и HTTP018                       | Passed isolated                 |
| quickstart.md                     | Существующие команды, фиктивные данные, уровни приёмки                            | Passed                          |
| checklists/requirements.md        | Качество согласованных требований отдельно от выполнения                          | Passed readiness                |
| checklists/acceptance.md          | A01–A08/A10–A11 доказаны; A09 не объявлен выполненным                             | Passed isolated;A09 external    |
| verification.md                   | Фактические поведенческие Red/Green, regression и итоговые результаты             | Passed isolated                 |
| analysis.md                       | Полный актуальный отчёт анализа                                                   | Сохранён отдельно после прохода |

Прочитаны связанные контракты014/018/025, публичные вызовы021/023/024,
AGENTS.md, GIT_POLICY.md, CODING_RULES.md, CODE_STYLE.md и constitution.
Сверены messaging-specs/readiness/project-overview/chat-ui-spec и утверждённый
max-chat-mockup.html. Локальные ссылки полного комплекта018–025 и четырёх
общих документов не имеют разрывов.

## Ревью исходников и общих контрактов

- ChatHistoryPanel/State, MessageList/Bubble имеют отдельные папки, public index,
  локальные constants и SCSS Modules. Частный use-message-scroll отделяет
  измерение/позицию от списка. Изменён только conversation slot главной;
  Header/Pane/поиск/мобильная навигация025 сохранены.
- useChatHistory018 использует прежний scope/chat/accessId и свежий count10.
  Отладочный ChatHistoryController и вывод истории удалены по прямому ревью пользователя; Panel использует HTTP018. Query дедуплицирует подписчиков;
  merged hooks не создают второй fetch, useState-копию или постоянное хранение.
- applyMessageFacts/addAcceptedMessage и pure merge проверяют active/identity,
  не создают message из status-only, удерживают known data при empty/error,
  применяют положительные статусы монотонно и возвращают contradictions.
  Синхронный read→merge→setQueryData не содержит await; уведомления batch.
- Early facts ограничены согласованными TTL300000/max1000, имеют injected clock
  и lazy cleanup. Общий issue — latest факт по chat/connection, без вымышленного
  сообщения; history consumer сразу публикует returned issue.
- contentSources остаётся необязательной частью той же MessageCache и не меняет
  MessageDTO. Подтверждённый provider-текст заменяет локальный accepted-текст;
  известный provider-текст сохраняется. Обработка редактирований не входит в019.
- Session overlay даёт прежний PersonalChat[] как union и отдельную fallback
  подпись; подтверждение GetChats поглощает pending fact, empty/error его не
  удаляют. Известный список остаётся рядом с error card. Сетевые defaults014
  не меняются; memory defaults structuralSharing:false сохраняют own-ключи Record.
- Вызовы будущих021/023/024 соответствуют текущим signatures и ownership.
  Source live/statuses, accepted helper, rememberPersonalChat и issue hook готовы
  как общее ядро; реальные receiving/SSE/ACK/send producers не написаны в019.
- По замечанию пользователя значимые тексты/статусы/источники/fixtures новых
  тестов вынесены в именованные константы с module-scope destructuring. Ожидания
  публичных контрактов независимы от констант формируемого ответа. Одноразовые
  структурные строки и названия тестов сохраняют исключение CODING_RULES.
- SCSS размеры/цвета/радиусы/тени пузырей сверены с макетом через tokens/theme;
  нет новой сетевой pagination, фальшивых галочек или редизайна соседних областей.

## Findings

| ID  | Категория | Важность | Место | Суть                                                                                                   | Рекомендация                                                                         |
| --- | --------- | -------- | ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| —   | —         | —        | —     | Неустранённых противоречий, непокрытых требований или дефектов правил в проверенной области не найдено | Продолжить пользовательское ревью019; совместный сценарий проверить после023/021/024 |

NotRunExternal — явная внешняя зависимость, а не скрытый Passed или дефект
изолированного этапа. Условный критерий SC-005 не завершён и задача T011 не отмечена.

## Покрытие FR/SC → задачи и доказательства

| Требование | Задачи                               | Проверка                                                            |
| ---------- | ------------------------------------ | ------------------------------------------------------------------- |
| FR-001     | T008–T010,T012                       | Existing/found selection, cookie/history API018 и видимый slot      |
| FR-002     | T002–T004,T008–T010,T012             | count10 каждый access, retention/dedup, >10 merged                  |
| FR-003     | T002–T004,T008–T010,T012             | pending/empty/nonempty/error, без удаления известного               |
| FR-004     | T008–T010,T012                       | Направление/время/HTML literal/wrap и визуальная сверка             |
| FR-005     | T002–T004,T008–T010,T012             | A→B→A/close/logout/scope регрессия018/025                           |
| FR-006     | T008–T010,T012–T013                  | scroll без fetch, count10, без лимита accumulated                   |
| FR-007     | T002–T007,T011–T012                  | identity/sources/core/overlay Passed; совместный HTTP external      |
| FR-008     | T002–T004,T011–T012                  | Пересечения в core Passed; настоящий incoming/history external      |
| FR-009     | T008–T010,T012                       | Placeholder/no attachment request                                   |
| FR-010     | T002–T004,T008–T011,T013             | Monotonic/early/contradictions без fake bubble; indicators позже024 |
| FR-011     | T002–T010,T012–T013                  | Query lifetime/GC/close, отсутствие DB/persist                      |
| FR-012     | T005–T010,T012–T013                  | Макет пяти ширин, сохранение списка/поиска/шапки                    |
| SC-001     | T008–T010,T012                       | count10 по выбранному/найденному chatId и guards                    |
| SC-002     | T008–T010,T012                       | Состояния, safe text/media, direction/time/mockup                   |
| SC-003     | T002–T010,T012                       | Retention/id/empty/error/overlay fixtures                           |
| SC-004     | T002–T004,T008–T010,T012             | Поздние ответы и session lifecycle                                  |
| SC-005     | T002–T004 foundation,T011 integrated | Foundation Passed; integrated NotRunExternal                        |
| SC-006     | T005–T010,T012–T013                  | Границы diff, неизменный count, scroll и отсутствие будущей сети    |

## C1–C8

| Принцип | Результат       | Основание                                                                              |
| ------- | --------------- | -------------------------------------------------------------------------------------- |
| C1      | Passed          | Решения count/retention/unsupported/mockup согласованы пользователем                   |
| C2      | Passed          | Только019; будущие022/023/020/021/024 не реализуются автоматически                     |
| C3      | Passed          | Полный предреализационный анализ и явная авторизация есть; повторный gate не требуется |
| C4      | Passed          | Git read-only, index пуст, пользовательские данные/изменения сохранены                 |
| C5      | Passed          | Никаких установок/миграций/изменений сообщений Telegram                                |
| C6      | Passed          | Явный FEATURE_DIR, фиктивные данные, scope/active/identity guards                      |
| C7      | Passed isolated | Фактические Red→Green→Refactor и проверки записаны; внешний T011 открыт                |
| C8      | Passed          | Один Query cache, существующие инструменты/макет, ревью правил охватывает тесты        |

T001/T013/T014 имеют процессное основание C3/C4/C7/C8; требований без задач
и задач без требования либо процессного основания нет. Параллельных T-ID нет.

## Метрики и фактические проверки

| Метрика                                               | Значение                           |
| ----------------------------------------------------- | ---------------------------------- |
| FR / SC                                               | 12 / 6                             |
| Tasks                                                 | 14:13 checked,1 NotRunExternal     |
| Запланированное покрытие FR / SC                      | 100% / 100%                        |
| Неохваченные требования                               | 0                                  |
| Дубли T-ID / существенные неоднозначности             | 0 / 0                              |
| Неустранённые Critical / High / Medium / Low          | 0 / 0 / 0 / 0                      |
| Broken local links                                    | 0                                  |
| Полный integration основного этапа019                 | 211 Passed                         |
| Полный Query                                          | 23 Passed                          |
| Целевой E2E основного этапа019                        | 28 Passed                          |
| Production build / typecheck / lint / styles / format | Passed                             |
| Read-only inventory                                   | 568 файлов, все SHA до/после равны |

Плановое покрытие100% не означает выполненный совместный SC-005. Первые
неуспешные прогоны и окончательные Green честно разделены в verification.md.
Первый широкий E2E дал93 Passed/2 Failed; после исправления выполнен целевой28,
включающий оба упавших сценария. Полный95 после последних правок не объявляется
заново выполненным. Скриншоты макета просмотрены на320/360/390/768/1280px.

## Непроведённые проверки и следующий шаг

T011/SC-005 требует реальных producers023/021/024 и пока NotRunExternal.
Ручная приёмка с настоящим GREEN-API, реальные настройки/уведомления,
поставка/прочтение, deploy/proxy/SSE buffering — NotRun. Изолированные fake
факты не доказывают эти сценарии. Полнота истории и заполнение промежутков
не обещаются. Pagination, attachments, DB/persist, sending и status indicators
не добавлены. Следующая отдельно обсуждаемая feature —022.

Изолированная019 готова к ревью. Коммит не создан и файлы не добавлены в stage.
Название: `feat: render retained chat history with shared message cache`.

## Итог ревью консоли2026-10-02

Проверены прямое поручение пользователя убрать ошибки IDE/браузера и лишний лог,
useBaseQuery установленного Query5.104.0, memory defaults и новые тесты.
enabled:false само по себе не устраняло предупреждение отсутствия queryFn в
development. queryFn:skipToken явно обозначает отсутствие загрузчика у четырёх
memory-префиксов. Данные продолжают читаться и обновляться через Query; сетевые
GetChats/GetChatHistory, count10, session guards, retention и макет сохраняются.
Фильтра console, искусственного загрузчика/[] или новой сети нет.

Red:4 development SSR tests падали именно на No queryFn; E2E отсутствия лога —
1 Failed на прежнем debug output. Green после исправления:35 затронутых integration,
23 Query,13 E2E. Production build/typecheck/lint/format Passed. Стилей данный
review не меняет; предыдущий Stylelint Passed остаётся применимым.
Полный215 integration и полный95 E2E после этого review не запускались;
прежние211/28 относятся к основному этапу019 и не выдаются за повторный прогон.

Удалённые ChatHistoryController/{ChatHistoryController.tsx,constants.ts,index.ts}
и его mounts не нужны для загрузки: hook остаётся у Panel и Query consumers.
Тесты получают подтверждение через реальное состояние/ответы и проверяют отсутствие
debug вывода. Memory SSR test воспроизводит настоящую development-ветку библиотеки,
проверяет чтение данных, отсутствие console errors и isFetching:0.

Локальные ссылки, FR12/SC6→T14 и C1–C8 снова сверены; findings в разрешённой
области нет. Внешний T011 остаётся NotRunExternal. Полный список568 SHA до/после
этого read-only прохода совпал; этот отчёт актуализирован отдельным действием.
Название исправления: `fix: disable cache-only queries and remove history debug logs`.
