# Data model 044: владельцы и срок жизни

| Данные | Владелец | Ключ/срок | Закрытие |
| --- | --- | --- | --- |
| QueryClient, active, cleanups, retain | generic QuerySession | Один экземпляр на connectionScope | abort pending, все callbacks, clear client |
| Список чатов провайдера | chats query options | `['chats', scope]`; stale 60 s, GC 300 s | clear client |
| Накопленные сообщения | message cache | `['messages', scope, chatId]`; GC Infinity | clear client |
| Ранние статусы | message cache | `['message-status-facts', scope]`; внутри TTL 5 min/limit 1000, Query GC Infinity | clear client |
| Проблемы | message issue cache | `['message-status-issues', scope]`; GC Infinity | clear client |
| Временные чаты | session chat cache | `['session-chats', scope]`; GC Infinity | clear client |
| Seen/unread/readable | unread cache | `['chat-unread', scope]`; GC Infinity | clear client |
| Выбор и панель | ConversationSelectionProvider | React state на экземпляр подключения; accessId/selectionEpoch различаются | unmount/provider remount |

`seenByChatId` остаётся после удаления unread метки и не позволяет повтору сообщения стать новым в той же сессии. В новом подключении состояние пустое даже при том же chatId. История, отправка, статус и ignored не добавляют unread. Вычисленные counts/chat list/messages читаются из базовых проекций без вторичного store.
