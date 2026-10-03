# Data model 049 — существующие состояния

Новых хранилищ или пользовательских полей нет. Перенос сохраняет следующие контракты:

| Модель | Владелец после 049 | Инвариант |
| --- | --- | --- |
| `ConversationTarget` и `ConversationSelection` | `conversation/selection/model` | `chatId`, label, `accessId`, `selectionEpoch` и mobile panel сохраняют переходы `OPEN/SHOW_LIST/CLOSE` |
| История | `conversation/history/model` для нормализации/валидации; существующий Query application для чтения | `chatId` и сообщение валидируются до применения; credential text не попадает в UI |
| Редактор | `conversation/ui/MessageComposer` | текст, revision и selection epoch определяют владельца позднего результата; новый чат не очищается им |
| Send attempt | существующий send controller + `conversation/ui/MessageSendProvider` | не более одной активной попытки на подключение, unknown требует ручной проверки |
| Notification owner | существующий lifecycle + `conversation/ui/NotificationProvider` | один активный owner; recovery/refetch не запускает повтор отправки |
| History panel projection | `conversation/ui/ChatHistoryPanel` hook | error > pending > fetching > empty; список показывается при имеющихся сообщениях, recovery вызывает refetch |
| Chat list composition | `conversation/ui/ConversationChatListPanel` → `chats/ui/ChatListPanel` | selected ID, `onSelect` и unread counts передаются через props, список не читает conversation context |

Список сообщений, статус и unread остаются в существующем Query-сеансе. Дублирующий кеш или локальное постоянное хранилище не создаются.
