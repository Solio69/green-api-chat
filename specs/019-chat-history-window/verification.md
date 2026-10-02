# Verification: история выбранного чата

**Дата**: 2026-10-02. **Feature**: 019-chat-history-window.
**Авторизация**: пользователь разрешил отображение строго по макету и отдельные компоненты.
**Результат**: Passed isolated, готово к ревью; T011/SC-005 — NotRunExternal.

## Реализованная граница

ChatHistoryPanel подключён к conversation slot без изменения шапки, поиска
или каркаса025. ChatHistoryState отвечает за ожидание, пустоту, ошибку и повтор;
MessageList — за список и прокрутку; MessageBubble — за направление, безопасный
текст, неподдерживаемый тип и известное время. Частный use-message-scroll
сохраняет положение читателя выше низа. Галочки и форма отправки не добавлены.

Запрос018 переиспользуется: свежий count:10 на каждое новое обращение;
Отладочный консольный вывод убран по ревью пользователя. Объединённые сообщения остаются в одной области
Query, включая отсутствующие в свежем окне. Отдельного fetch в merged hook нет.
Ошибки и пустой ответ не стирают известные сообщения. Текст не интерпретируется
как HTML; вложения не загружаются; прокрутка не расширяет count.

Общее ядро019 предоставляет applyMessageFacts/addAcceptedMessage,
useConversationMessages, publishMessageIssues/useMessageIssues и session chat
overlay для будущих021/023/024. Реальная отправка, очередь, SSE/ACK в019 отсутствуют.
MessageDTO и публичные signatures сохраняют контракт будущих производителей.
contentSources — необязательные метаданные в той же записи messages, позволяющие
сохранить live-содержимое без timestamp. Memory-префиксы отключают structuralSharing
для безопасных own-ключей Record; сетевые defaults списка014 прежние.

## Поведенческие Red → Green

Ошибка импорта или настройки не засчитывалась как Red. Первые прогоны использовали
существующее ядро018 или непосредственно управляемый Query consumer, а не импорт
несуществующей реализации. После Green временные тестовые обходы удалены:
тесты вызывают настоящие helpers и компоненты.

| Область              | Команда Red                                                                                    | Подтверждённое падение                                                                                                           | Green                                              |
| -------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Message core         | npm run test:integration -- tests/integration/message-cache.spec.ts                            | 8 failures: ранние статусы игнорировались/создавали пустую запись, отсутствовали TTL/retention/валидация и приоритет содержимого | Целевые integration Passed; затем общий 211 Passed |
| Общий issue consumer | npm run test:query -- tests/query/history-window.spec.ts                                       | 1 failure: history failure→read не публиковал returned issue                                                                     | Целевой набор Passed; итоговый Query23 Passed      |
| Overlay              | npm run test:integration -- tests/integration/session-chat-facts.spec.ts                       | 1 failure,1 passed: подтверждённый provider chat не поглощал pending fact                                                        | Целевые и итоговые integration Passed              |
| Overlay consumer     | npm run test:query -- tests/query/session-chat-overlay.spec.ts                                 | 1 failure: pending-known строка отсутствовала                                                                                    | Целевой набор и итоговый Query23 Passed            |
| Видимая история      | npm run test:query -- tests/query/history-window.spec.ts                                       | 2 failures,1 passed: отсутствовали состояния и список истории                                                                    | Итоговый Query23 Passed                            |
| Макет                | npm run test:e2e -- tests/e2e/history-window.spec.ts                                           | 5 failures: сообщения не отображались на пяти ширинах                                                                            | 6 новых E2E Passed в итоговом целевом наборе28     |
| Live без timestamp   | npm run test:integration -- tests/integration/message-cache.spec.ts --grep 'without timestamp' | 1 failure: поздняя history заменяла live-текст                                                                                   | Целевой и общий integration Passed                 |

Дополнительная регрессия при расширении проверки: полный integration дал
210 Passed/1 Failed — Query deep replace терял собственный ключ `__proto__`
overlay после повторной записи. Исправлены memory defaults, после чего целевые31
и полный набор211 Passed. Это найденная регрессия, а не первоначальный Red всех тестов.

В первом широком Query/E2E прогоне обнаружены прежние ожидания скрытого списка
при ошибке и нестабильное отображение recovery во время повтора. Известный список
сохранён рядом с error card; recovery удерживается по errorCopy. Тест Query
использует разные именованные подписи обычного и ожидающего повтора.
Окончательный результат приведён ниже; ранние ошибочные прогоны не названы Passed.

## Итоговые проверки

| Команда                                                                                                                                                                                               | Фактический результат                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| npm run test:integration                                                                                                                                                                              | Passed: 211 тестов                                            |
| npm run test:query                                                                                                                                                                                    | Passed: 23 теста                                              |
| npm run test:e2e -- tests/e2e/chat-list-ui.spec.ts tests/e2e/chat-workspace.spec.ts tests/e2e/conversation-selection.spec.ts tests/e2e/history-api.spec.ts tests/e2e/history-window.spec.ts           | Passed: 28 тестов; production build внутри E2E запуска Passed |
| npm run typecheck                                                                                                                                                                                     | Passed                                                        |
| npm run lint                                                                                                                                                                                          | Passed                                                        |
| npm run lint:styles                                                                                                                                                                                   | Passed                                                        |
| npm run format:check                                                                                                                                                                                  | Passed, исходники и тесты                                     |
| node node_modules/prettier/bin/prettier.cjs --check --ignore-path NUL specs/019-chat-history-window docs/messaging-specs.md docs/messaging-readiness.md docs/project-overview.md docs/chat-ui-spec.md | Passed после окончательного обновления документов             |

Первый полный E2E запуск дал93 Passed/2 Failed из95. После исправления повторён
затронутый набор28, покрывающий оба упавших сценария и все изменения UI.
Полный95 после последней правки повторно не запускался и целиком Passed не заявляется.

## Что проверено

- Identity scope/chatId/idMessage, одинаковый текст разных id, все sources,
  монотонные положительные статусы, противоречия и отсутствие bubble из status-only.
- Ранние факты: TTL300000, максимум1000, ленивая очистка, стабильное вытеснение,
  повтор без продления, attach, injected clock без реального ожидания.
- Active=false/close, чужой chat/scope и атомарный отказ некорректной пачки;
  память удерживается до close, новые записи после close не появляются.
- Session chat union, отдельно label/profile, accepted/incoming, provider reconcile,
  пустой/error refresh, безопасные непрозрачные ключи и прежняя политика списка014.
- Свежие count10, >10 retained, A→B→A, поздние ответы, back/close и lifecycle018/025;
  empty/pending/error с данными и без, отображение без отладочных логов.
- HTML-подобный текст как литерал, переносы, длинное слово, media placeholder;
  нет attachment request и запроса по scroll. Начальное открытие внизу,
  обновление выше низа удерживает положение.
- Скриншоты фиктивной production-страницы проверены на320/360/390/768/1280px:
  направление, цвета, радиусы и отступы пузырей сверены с
  [утверждённым макетом](../../docs/ui-references/max-chat-mockup.html).
  Шапка, поиск и боковая панель сохранены. Горизонтальное переполнение не появляется.
- По ревью прочитаны CODING_RULES.md/CODE_STYLE.md: семантические значения тестов
  находятся в именованных fixtures/constants; независимые ожидания контрактов
  не импортируют те же значения, которыми формируется проверяемый ответ.
  Названия тестов и одноразовые структурные строки не требуют искусственных констант.

## Непроведённые проверки

T011/SC-005 NotRunExternal: реальные producers023/021/024 ещё не реализованы.
Изолированные факты не заменяют совместный HTTP/SSE/ACK/Send сценарий.
Реальные реквизиты GREEN-API, ручная пользовательская приёмка, proxy/deploy,
поставка/прочтение сообщения и настройки уведомлений не проверялись.
Постоянная БД, браузерное persist storage, pagination и автоматическая отправка
не добавлялись. Полнота истории Telegram не обещается.

## Предкоммитное ревью

Область ограничена019, её тестовыми fixtures и необходимой интеграцией
существующего Query/списка. Общие документы актуализированы точечно;
пользовательский README сохранён; в023 точечно перенесён путь будущего recovery с удалённого Controller на Panel, без кода023. Остальные будущие документы сохранены. Git mutations,
установка пакетов и обращения к реальному провайдеру не выполнялись.
Полный read-only отчёт C1–C8 и покрытия — [analysis.md](analysis.md).

Предложенное название коммита: `feat: render retained chat history with shared message cache`.

## Проверка исправления предупреждений и удаления лога

Авторизация: пользователь2026-10-02 показал предупреждения IDE/браузера
No queryFn и попросил убрать отладочный лог истории. Проверены установленные
useBaseQuery.ts и официальная документация
[skipToken](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).
Предупреждение существует только в development; ранние production browser tests
его не воспроизводили. Для cache-only memory keys зарегистрирован skipToken;
enabled:false и сетевые queryFn GetChats/GetChatHistory не заменяются.

Поведенческий Red: npm run test:integration -- tests/integration/memory-query.spec.ts —
4 Failed именно из-за console.error No queryFn для messages/session-chats/status-facts/issues.
Red удаления лога: npm run test:e2e -- tests/e2e/history-api.spec.ts --grep 'without history debug logs' —
1 Failed из-за прежнего GetChatHistory console output. После исправления:

- npm run test:integration -- tests/integration/memory-query.spec.ts tests/integration/message-cache.spec.ts tests/integration/session-chat-facts.spec.ts tests/integration/history-query.spec.ts tests/integration/chat-query.spec.ts —35 Passed.
- npm run test:query —23 Passed.
- npm run test:e2e -- tests/e2e/history-api.spec.ts tests/e2e/history-window.spec.ts —13 Passed, production build Passed.
- npm run lint, npm run typecheck, npm run format:check —Passed.

Прежние211 integration/28 целевых E2E в таблице выше относятся к основному
этапу019; после данного ревью повторены именно затронутые35/13 и весь Query23.
Новый SSR test действительно использует development-ветку React Query и проверяет
отсутствие console errors, чтение записанных данных и isFetching:0. Консоль не
фильтруется в приложении. История отображается; ее содержимое не печатается.
