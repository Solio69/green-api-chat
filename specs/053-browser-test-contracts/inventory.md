# Инвентаризация браузерных контрактов 053

Discovery на текущем `refactor`: production E2E — 20 файлов и 112 сценариев; Query browser — 7 файлов и 37 сценариев. Всего **149**. [Поимённая карта](browser-map.json) сохраняет 109 ID E2E из B028 и 37 ID Query из 052. Три E2E, добавленные после B028, получили `N053-E-0001…0003`. Девять Query, перенесённых в RTL в 052, уже исключены из browser discovery и сохранены в [карте 052](../052-react-test-migration/scenario-map.json). Никакой текущий браузерный тест 053 не удаляет.

| Файл | Сценариев |
| --- | ---: |
| `tests/e2e/account-profile.spec.ts` | 11 |
| `tests/e2e/chat-list-ui.spec.ts` | 8 |
| `tests/e2e/chat-workspace.spec.ts` | 1 |
| `tests/e2e/chats-api.spec.ts` | 4 |
| `tests/e2e/conversation-selection.spec.ts` | 7 |
| `tests/e2e/fixture-isolation.spec.ts` | 2 |
| `tests/e2e/health.spec.ts` | 2 |
| `tests/e2e/history-api.spec.ts` | 7 |
| `tests/e2e/history-scroll.spec.ts` | 10 |
| `tests/e2e/history-window.spec.ts` | 6 |
| `tests/e2e/home.spec.ts` | 2 |
| `tests/e2e/login-flow.spec.ts` | 6 |
| `tests/e2e/login-form-safety.spec.ts` | 5 |
| `tests/e2e/login-form.spec.ts` | 9 |
| `tests/e2e/login-ui.spec.ts` | 15 |
| `tests/e2e/logout-flow.spec.ts` | 4 |
| `tests/e2e/message-composer.spec.ts` | 3 |
| `tests/e2e/recipient-search-ui.spec.ts` | 1 |
| `tests/e2e/recipient-search.spec.ts` | 8 |
| `tests/e2e/search-layout.spec.ts` | 1 |
| `tests/query/chat-query.spec.ts` | 8 |
| `tests/query/conversation-selection.spec.ts` | 1 |
| `tests/query/history-query.spec.ts` | 2 |
| `tests/query/history-window.spec.ts` | 4 |
| `tests/query/message-composer.spec.ts` | 8 |
| `tests/query/polling-workspace.spec.ts` | 3 |
| `tests/query/unread-indicators.spec.ts` | 11 |

Критические связанные пути: login/session/redirect/logout (`login-*`, `home`, `logout-flow`, `chats-api`); список/выбор/поиск/история/отправка/получение/status/unread (`chat-*`, `conversation-*`, `recipient-*`, `history-*`, `message-composer`, Query `polling-workspace`, `unread-indicators`); cookie/access/scope/tab/Web Locks (`login-flow`, `chats-api`, `history-api`, `conversation-selection`, Query `chat-query`, `polling-workspace`); keyboard/focus/scroll/responsive/theme/safe text (`login-form*`, `login-ui`, `account-profile`, `chat-list-ui`, `history-scroll`, `search-layout`, Query `history-window`, `unread-indicators`). Точные assertions и preconditions — в исходных файлах и карте, не выводятся из одного названия.

Baseline Green 052: Query 37/37, E2E 112/112, quality 470/470; code CI 37160908926 success. CI 052 docs run 37161301618 ещё выполняется на момент инвентаризации. Конфигурация имеет `retries: 0`, явный Chromium, production build, раздельные HTML/trace artifacts. Два browser suite запускаются последовательно, поскольку используют отдельные сборки и каталоги отчётов.
