# Inventory 052 — React and browser scenarios

Playwright discovery текущего Query-набора: 8 файлов, 46 сценариев; исходный Green 46/46 на SHA 051. Из B028 сохранились 45 ID (включая явное переименование `B028-Q-0007`), один новый получает `N052-Q-0001`. Для полного соответствия ID и заголовков — [scenario-map.json](scenario-map.json).

| Исходный файл | Всего | RTL | Browser |
| --- | ---: | ---: | ---: |
| `tests/query/chat-query.spec.ts` | 9 | 1 | 8 |
| `tests/query/conversation-selection.spec.ts` | 4 | 3 | 1 |
| `tests/query/history-query.spec.ts` | 6 | 4 | 2 |
| `tests/query/history-window.spec.ts` | 4 | 0 | 4 |
| `tests/query/message-composer.spec.ts` | 8 | 0 | 8 |
| `tests/query/polling-workspace.spec.ts` | 3 | 0 | 3 |
| `tests/query/session-chat-overlay.spec.ts` | 1 | 1 | 0 |
| `tests/query/unread-indicators.spec.ts` | 11 | 0 | 11 |

Переносится 9 React-сценариев: четыре сценария history provider, три selection, один chats loading/empty и один session overlay. Остальные 37 сохраняют реальную браузерную/Next/HTTP часть контракта до анализа 053. Сценарии с консольными ошибками и реальным HTTP retry намеренно пока остаются в браузере. Полное удаление query-app не предусмотрено: он нужен сохранённым контрактам.

Для `SessionOverlayProbe` единственный пользователь — переносимый сценарий: после Green его и ветку `?overlay` можно удалить. `HistoryProbe`, `SelectionProbe`, `QueryProbe`, `MessagingProbe`, `UnreadProbe` остаются занятыми сохранёнными сценариями. Из `history-query.spec.ts` удаляются только четыре перенесённых теста; из `conversation-selection.spec.ts` — три; из `chat-query.spec.ts` — один.
