# Verification: история выбранного чата

**Дата**: 2026-10-03. **Feature**: 019-chat-history-window.
**Авторизация**: отображение и ядро разрешены 2026-10-02; исправление растягивания окна прямо запрошено пользователем 2026-10-03.
**Результат**: PassedSynthetic, включая T011/SC-005 после интеграции020–024. Реальный GREEN-API — NotRun.

## Проверенная реализация

История использует свежий count:10 при каждом обращении, удерживает сообщения
в памяти Query и объединяет их по scope/chatId/idMessage. Ошибка или пустой
ответ не уничтожают известное. React text nodes сохраняют переносы и не
исполняют HTML; нетекстовые сообщения получают нейтральное обозначение.
Прокрутка не загружает старую историю и не меняет count.

Каркас ограничен прежним размером макета и динамической высотой viewport.
Grid/flex предки позволяют истории сжиматься; MessageList прокручивается,
шапка и composer остаются на месте. Удалены вычисления высоты истории через
жёсткое вычитание высот соседей. Пузыри сохраняют естественную высоту. Начало
переписки располагается за верхней границей scroll container, последние
сообщения видны внизу. Ручная прокрутка вверх сохраняет позицию при обновлении.
В отдельной HistoryProbe добавлен ограниченный родитель: тест проверяет
настоящую прокрутку, а не растягивание самостоятельной панели.

## Red → Green для исправления высоты

- Red: npm run test:e2e -- tests/e2e/history-scroll.spec.ts --grep 'width 1280' — 1 Failed. До загрузки высота pane 648px, после десяти длинных сообщений 3142px; упало ожидание неизменной высоты. Сборка прошла; это воспроизведённое поведение.
- После исправления: 22 целевых E2E Passed. Добавлены проверки viewport 480px, ручной прокрутки и нахождения поля внутри viewport.
- Итоговый Green: npm run test:e2e -- tests/e2e/history-scroll.spec.ts tests/e2e/history-window.spec.ts tests/e2e/message-composer.spec.ts tests/e2e/chat-workspace.spec.ts tests/e2e/conversation-selection.spec.ts tests/e2e/search-layout.spec.ts — 27 Passed, 43.5s; production build Passed.
- npm run test:query — 31 Passed, 36.3s, включая initial bottom и удержание пользовательской позиции после обновления. Fixture build Passed.
- npm run lint / npm run lint:styles / npm run typecheck / npm run format:check — Passed. Дополнительно npx stylelint tests/fixtures/query-app/components/HistoryProbe/HistoryProbe.module.scss — Passed.
- Промежуточный lint обнаружил два нарушения порядка импортов нового теста; исправлены до итогового Passed.

Десять overflow E2E охватывают ширины 320/360/390/768/1280 и высоты 800/480.
Проверены неизменные высота pane и положение поля до/после загрузки и SSE,
scrollHeight > clientHeight, расстояние до низа ≤2px, первый элемент выше
границы, последняя bubble внутри списка и возможность прокрутить к первой.
Все provider-вызовы и сообщения в этих тестах фиктивные.

Скриншоты history-overflow-{width}-{height}.png получены production E2E.
Визуально просмотрены desktop1280×800, mobile360×800 и mobile360×480: шапка
и форма на месте, старые сообщения обрезаны верхней границей, входящее видно.
Проверка настоящего мобильного экранного клавиатурного viewport — NotRun.

## Доказательства ядра и совместной интеграции

Ниже подтверждённые Red/Green основного этапа019; они не выдаются за новые
прогоны текущего исправления CSS.

| Область              | Команда Red                                                                                    | Подтверждённое падение                                                                                                           | Green                                              |
| -------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Message core         | npm run test:integration -- tests/integration/message-cache.spec.ts                            | 8 failures: ранние статусы игнорировались/создавали пустую запись, отсутствовали TTL/retention/валидация и приоритет содержимого | Целевые integration Passed; затем общий 211 Passed |
| Общий issue consumer | npm run test:query -- tests/query/history-window.spec.ts                                       | 1 failure: history failure→read не публиковал returned issue                                                                     | Целевой набор Passed; итоговый Query23 Passed      |
| Overlay              | npm run test:integration -- tests/integration/session-chat-facts.spec.ts                       | 1 failure,1 passed: подтверждённый provider chat не поглощал pending fact                                                        | Целевые и итоговые integration Passed              |
| Overlay consumer     | npm run test:query -- tests/query/session-chat-overlay.spec.ts                                 | 1 failure: pending-known строка отсутствовала                                                                                    | Целевой набор и итоговый Query23 Passed            |
| Видимая история      | npm run test:query -- tests/query/history-window.spec.ts                                       | 2 failures,1 passed: отсутствовали состояния и список истории                                                                    | Итоговый Query23 Passed                            |
| Макет                | npm run test:e2e -- tests/e2e/history-window.spec.ts                                           | 5 failures: сообщения не отображались на пяти ширинах                                                                            | 6 новых E2E Passed в итоговом целевом наборе28     |
| Live без timestamp   | npm run test:integration -- tests/integration/message-cache.spec.ts --grep 'without timestamp' | 1 failure: поздняя history заменяла live-текст                                                                                   | Целевой и общий integration Passed                 |

Memory-query SSR Red: 4 Failed из-за отсутствующего queryFn для кешевых
префиксов; после skipToken целевые35 integration, Query23 и E2E13 Passed.
Удаление debug logs: Red1 Failed в history-api E2E; после удаления Passed.
Основной этап019: полный211 integration, Query23, целевой E2E28 Passed.

T011/A09/SC-005 — PassedSynthetic после020–024: incoming применяется и ACKed
до поздней истории, ранний read сохраняется до HTTP acceptance; отсутствуют
пустая bubble, дубль и понижение read. Сценарии tests/query/message-composer.spec.ts
повторно проходят в текущем полном Query31. Прежний общий прогон342 integration
и production E2E99 относится к приёмке020–024; после текущего CSS-исправления
полный integration и полный E2E не повторялись. Серверные контракты не менялись.

## Границы и ревью

Новых dependencies, DB, persistent browser storage, pagination и изменений
Send/Receive/Delete нет. Токены размеров и цветов, SCSS Modules/БЭМ и порядок
импортов проверены. Семантические fixture тексты, ID, viewport и допуск scroll
лежат в tests/history/constants.ts. Хук управления scroll не переписан.
Git mutations и изменения staging не выполнялись. Полный актуальный анализ:
[analysis.md](analysis.md). Название коммита: fix: constrain conversation height and keep messages scrollable.
