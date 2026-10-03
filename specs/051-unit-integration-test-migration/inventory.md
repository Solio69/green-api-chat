# Инвентарь миграции 051

Источник: текущий `playwright.integration.config.ts --list --reporter=json`, 28 файлов / 366 развернутых сценариев. B028 IDs сопоставлены по точному заголовку с [реестром 028](../028-refactor-test-baseline/test-inventory.json): 351 совпадение. Пятнадцать сценариев, добавленных после 028, получили постоянные `N051-I-0001`–`N051-I-0015`. Поименная связь каждого сценария и целевого файла сохранена в [scenario-map.json](scenario-map.json). Обнаружение — не выполнение; исходный Green подтверждён прогоном 050.

| Текущий файл | Всего | B028 | Новые | Целевой файл |
| --- | ---: | ---: | ---: | --- |
| `tests/integration/account-profile.spec.ts` | 7 | 7 | 0 | `tests/unit/account-profile-contract.test.ts` |
| `tests/integration/auth-flow.spec.ts` | 20 | 20 | 0 | `tests/integration/auth-flow.test.ts` |
| `tests/integration/chat-query.spec.ts` | 9 | 9 | 0 | `tests/integration/chat-query.test.ts` |
| `tests/integration/chats-api.spec.ts` | 42 | 42 | 0 | `tests/integration/chats-api.test.ts` |
| `tests/integration/check-account.spec.ts` | 7 | 7 | 0 | `tests/unit/check-account.test.ts` |
| `tests/integration/conversation-cache-coordinator.spec.ts` | 3 | 0 | 3 | `tests/integration/conversation-cache-coordinator.test.ts` |
| `tests/integration/conversation-selection.spec.ts` | 4 | 4 | 0 | `tests/unit/conversation-selection.test.ts` |
| `tests/integration/get-account-settings.spec.ts` | 26 | 26 | 0 | `tests/unit/get-account-settings.test.ts` |
| `tests/integration/get-state.spec.ts` | 22 | 22 | 0 | `tests/unit/get-state.test.ts` |
| `tests/integration/history-api.spec.ts` | 18 | 18 | 0 | `tests/integration/history-api.test.ts` |
| `tests/integration/history-query.spec.ts` | 9 | 9 | 0 | `tests/integration/history-query.test.ts` |
| `tests/integration/home-flow.spec.ts` | 14 | 14 | 0 | `tests/integration/home-flow.test.ts` |
| `tests/integration/login-route.spec.ts` | 5 | 5 | 0 | `tests/integration/login-route.test.ts` |
| `tests/integration/memory-query.spec.ts` | 4 | 4 | 0 | `tests/integration/memory-query.test.ts` |
| `tests/integration/message-cache.spec.ts` | 10 | 10 | 0 | `tests/integration/message-cache.test.ts` |
| `tests/integration/message-send-controller.spec.ts` | 6 | 6 | 0 | `tests/integration/message-send-controller.test.ts` |
| `tests/integration/message-statuses.spec.ts` | 7 | 7 | 0 | `tests/integration/message-statuses.test.ts` |
| `tests/integration/notification-cache.spec.ts` | 2 | 2 | 0 | `tests/integration/notification-cache.test.ts` |
| `tests/integration/notification-normalization.spec.ts` | 10 | 10 | 0 | `tests/unit/notification-normalization.test.ts` |
| `tests/integration/notification-provider.spec.ts` | 5 | 3 | 2 | `tests/unit/notification-provider.test.ts` |
| `tests/integration/polling-connection.spec.ts` | 16 | 14 | 2 | `tests/integration/polling-connection.test.ts` |
| `tests/integration/recipient-search.spec.ts` | 7 | 7 | 0 | `tests/integration/recipient-search.test.ts` |
| `tests/integration/send-message.spec.ts` | 61 | 61 | 0 | `tests/integration/send-message.test.ts` |
| `tests/integration/session-chat-facts.spec.ts` | 3 | 3 | 0 | `tests/integration/session-chat-facts.test.ts` |
| `tests/integration/session.spec.ts` | 6 | 6 | 0 | `tests/integration/session.test.ts` |
| `tests/integration/shared-http-contract.spec.ts` | 8 | 0 | 8 | `tests/integration/shared-http-contract.test.ts` |
| `tests/integration/unread-notifications.spec.ts` | 8 | 8 | 0 | `tests/integration/unread-notifications.test.ts` |
| `tests/integration/vercel-notifications.spec.ts` | 27 | 27 | 0 | `tests/integration/vercel-notifications.test.ts` |

Все тесты сейчас работают в Node и не запрашивают Playwright `page`, `context` или браузер. `home-flow`, `history-api`, `send-message` используют `Request`/`NextRequest` или прямой route export, но не поднимают настоящий Next server; их Node-адаптерные контракты переходят в integration. Реальные cookies/routes/браузерный lifecycle продолжают проверяться production E2E и Query suites.
