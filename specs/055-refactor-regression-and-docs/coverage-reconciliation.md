# Сверка критических гарантий 028 → итоговые тесты 055

Основание: [исходная матрица G01–G08](../028-refactor-test-baseline/coverage-matrix.md) и поимённые карты [051](../051-unit-integration-test-migration/scenario-map.json), [052](../052-react-test-migration/scenario-map.json), [053](../053-browser-test-contracts/browser-map.json). Здесь перечислены проверенные представители каждой гарантии, а карты сохраняют полный набор ID. Текущий путь и название каждого указанного сценария сверены с файловой системой; параметризованные title исходной карты, которые не являются буквальным именем test-case, не использованы как единственное доказательство.

| Гарантия | Текущий набор | Граница доказательства |
| --- | --- | --- |
| **G01** — Изоляция подключения, выход и потеря доступа | B028-I-0033, B028-I-0326, B028-Q-0004, B028-Q-0006, B028-Q-0009, B028-E-0018 | Node-кеш, реальный браузерный scope и production redirect; не доказывает конкурентность разных устройств. |
| **G02** — Поздний результат привязан к исходному чату и попытке | B028-I-0199, B028-Q-0024, B028-Q-0015 | Контролируемые задержки controller, browser editor и RTL history; не все возможные порядки сети. |
| **G03** — Отказ отличается от неизвестного исхода | B028-I-0203, B028-Q-0026 | Фиктивные сетевые ответы и UI ручной проверки истории; не доказывает доставку Telegram. |
| **G04** — Сначала apply, затем ACK; receive и ACK последовательны | B028-I-0226, B028-I-0328, B028-Q-0028 | Интеграционный цикл, независимый server context и браузерный cache; не нагрузочный тест Vercel. |
| **G05** — Повтор доставки не дублирует сообщение и unread | B028-I-0227, B028-I-0320, B028-Q-0035 | Модель, ACK и видимое состояние браузера; без реальной провайдерской очереди. |
| **G06** — История сохраняет подтверждённый статус и live-факты | B028-I-0194, B028-Q-0029 | Конфликт API-снимка и live-события; не исчерпывает все комбинации. |
| **G07** — Владение вкладкой и cleanup ресурсов | B028-I-0233, B028-I-0235, B028-Q-0031, B028-Q-0033 | Node lease/receive, настоящий Web Lock и RTL development lifecycle в tests/component/provider-lifecycle.test.tsx; без межустройственной координации. |
| **G08** — Клавиатура, фокус, прокрутка и адаптивность | B028-E-0026, B028-E-0029, B028-E-0076, B028-Q-0022, B028-Q-0038 | Chromium, конкретные viewport/theme и focus сценарии; не полная матрица браузеров/сертификация доступности. |

## Поимённые сценарии

| Гарантия | ID | Текущий файл | Название теста |
| --- | --- | --- | --- |
| G01 | B028-I-0033 | [tests/integration/chat-query.test.ts](../../tests/integration/chat-query.test.ts) | query: close aborts and late promise cannot restore cache; new account independent |
| G01 | B028-I-0326 | [tests/integration/unread-notifications.test.ts](../../tests/integration/unread-notifications.test.ts) | unread: memory defaults never refetch and close prevents resurrection or cross-scope reuse |
| G01 | B028-Q-0004 | [tests/query/chat-query.spec.ts](../../tests/query/chat-query.spec.ts) | React query: switching account rejects late data of old scope |
| G01 | B028-Q-0006 | [tests/query/chat-query.spec.ts](../../tests/query/chat-query.spec.ts) | React query: expiry closes and navigates |
| G01 | B028-Q-0009 | [tests/query/chat-query.spec.ts](../../tests/query/chat-query.spec.ts) | React query: 409 closes both consumers and refreshes once without login |
| G01 | B028-E-0018 | [tests/e2e/chat-list-ui.spec.ts](../../tests/e2e/chat-list-ui.spec.ts) | chat list: session rejection closes the displayed data and returns to login |
| G02 | B028-I-0199 | [tests/integration/message-send-controller.test.ts](../../tests/integration/message-send-controller.test.ts) | shared latch rejects a second send and late acceptance publishes to its captured chat |
| G02 | B028-Q-0024 | [tests/query/message-composer.spec.ts](../../tests/query/message-composer.spec.ts) | pending send survives switching chats and never clears the new editor |
| G02 | B028-Q-0015 | [tests/component/history-provider-contract.test.tsx](../../tests/component/history-provider-contract.test.tsx) | history React: A to B to A discards the earlier completion |
| G03 | B028-I-0203 | [tests/integration/message-send-controller.test.ts](../../tests/integration/message-send-controller.test.ts) | unknown outcome is never retried automatically and a rejected manual retry preserves uncertainty |
| G03 | B028-Q-0026 | [tests/query/message-composer.spec.ts](../../tests/query/message-composer.spec.ts) | lost response preserves input, requires a history check and leaves retry to the user |
| G04 | B028-I-0226 | [tests/integration/polling-connection.test.ts](../../tests/integration/polling-connection.test.ts) | loop applies a delivery before ACK and never receives again while ACK is pending |
| G04 | B028-I-0328 | [tests/integration/vercel-notifications.test.ts](../../tests/integration/vercel-notifications.test.ts) | receive on A and ACK on a fresh B delete only the signed receipt |
| G04 | B028-Q-0028 | [tests/query/message-composer.spec.ts](../../tests/query/message-composer.spec.ts) | incoming is applied and ACKed before late history, which preserves live content without duplicates |
| G05 | B028-I-0227 | [tests/integration/polling-connection.test.ts](../../tests/integration/polling-connection.test.ts) | duplicate deliveries ACK twice but count once |
| G05 | B028-I-0320 | [tests/integration/unread-notifications.test.ts](../../tests/integration/unread-notifications.test.ts) | unread: unique IDs increment, replays before and after reading do not |
| G05 | B028-Q-0035 | [tests/query/unread-indicators.spec.ts](../../tests/query/unread-indicators.spec.ts) | unread UI: another chat counts, duplicate delivery and ACK preserve one mark, opening clears it |
| G06 | B028-I-0194 | [tests/integration/message-cache.test.ts](../../tests/integration/message-cache.test.ts) | facts: provider fields replace accepted fields; late history preserves live content, identity and read |
| G06 | B028-Q-0029 | [tests/query/message-composer.spec.ts](../../tests/query/message-composer.spec.ts) | read notification before HTTP acceptance creates no empty bubble and attaches to the accepted message |
| G07 | B028-I-0233 | [tests/integration/polling-connection.test.ts](../../tests/integration/polling-connection.test.ts) | close during asynchronous lease acquisition releases the late lease without requests |
| G07 | B028-I-0235 | [tests/integration/polling-connection.test.ts](../../tests/integration/polling-connection.test.ts) | closing during receive discards the late result and sends no ACK |
| G07 | B028-Q-0031 | [tests/query/polling-workspace.spec.ts](../../tests/query/polling-workspace.spec.ts) | browser Web Lock blocks second tab and transfers after first closes without a server release |
| G07 | B028-Q-0033 | [tests/query/polling-workspace.spec.ts](../../tests/query/polling-workspace.spec.ts) | unsupported Web Locks shows explicit limitation instead of reading queue |
| G08 | B028-E-0026 | [tests/e2e/conversation-selection.spec.ts](../../tests/e2e/conversation-selection.spec.ts) | conversation: mobile back, tab order and resize preserve selection |
| G08 | B028-E-0029 | [tests/e2e/conversation-selection.spec.ts](../../tests/e2e/conversation-selection.spec.ts) | conversation focus: hiding the focused search moves focus to the selected conversation |
| G08 | B028-E-0076 | [tests/e2e/login-form.spec.ts](../../tests/e2e/login-form.spec.ts) | supports keyboard order, visible focus and accessible errors |
| G08 | B028-Q-0022 | [tests/query/history-window.spec.ts](../../tests/query/history-window.spec.ts) | history window: opening ends at bottom and refreshing while reading retains scroll position |
| G08 | B028-Q-0038 | [tests/query/unread-indicators.spec.ts](../../tests/query/unread-indicators.spec.ts) | unread UI: mobile hidden conversation counts, back button totals and resize reveals/clears selected chat |

## Исходные пробелы и результат

| Исходный пункт | Итоговая проверка |
| --- | --- |
| GAP-01 — Strict Mode replay | [030 verification](../030-react-lifecycle-contracts/verification.md): реальный development setup → cleanup → setup в [provider-lifecycle.test.tsx](../../tests/component/provider-lifecycle.test.tsx); отрицательный контроль без Strict Mode падал. |
| GAP-02 — три typecheck окружения | [031 verification](../031-complete-typecheck/verification.md): штатный `npm run typecheck` проверяет app, Vitest и Query fixture; команда повторяется в 055. |
| GAP-03 — GitHub CI | [033](../033-ci-quality-pipeline/verification.md) и [034](../034-ci-browser-pipeline/verification.md): две jobs, контролируемое падение с артефактом и восстановленный зелёный run; финальный SHA проверяется в 055 отдельно. |
| GAP-04 — хрупкий SVG oracle | [053 verification](../053-browser-test-contracts/verification.md): замена в четырёх E2E без потери действий, фокуса и геометрии; 149 браузерных контрактов сохранены. |
| DEFECT-01 — нестабильный mobile back/focus | [034 verification](../034-ci-browser-pipeline/verification.md): воспроизведён валидный Red с задержанным ResizeObserver, добавлен resize listener и cleanup; B028-E-0026 и финальные E2E сохраняются. |

Счётчики полного финального прогона и точный CI SHA находятся в [verification 055](verification.md). Настоящие GREEN-API, Telegram-доставка, облачный деплой и полный аудит доступности не входят в фиктивную автоматическую регрессию.
