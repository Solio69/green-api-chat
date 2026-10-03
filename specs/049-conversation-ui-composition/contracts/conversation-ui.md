# Контракт 049 — интерфейс переписки

## Публичные входы

- `@/features/conversation/selection/model`: `ConversationTarget`, `ConversationSelection`, `ConversationSelectionAction`, `ConversationSelectionAccess`, `CONVERSATION_PANEL/ACTION`, `createConversationSelection`, `reduceConversationSelection`.
- `@/features/conversation/history/model`: `normalizeHistory`, `validateHistoryRequest`.
- `@/features/conversation/ui`: компоненты рабочей области, истории, сообщений, редактора, статусов, notification, selection/send providers и используемые внешними потребителями hooks.
- `@/features/chats/ui/ChatListPanel`: получает `selectedChatId`, `onSelect`, `unreadCountsByChatId` через props; `ConversationChatListPanel` адаптирует selection/unread из conversation без обратной зависимости. `ChatWorkspace` получает готовый `sidebar: ReactNode`, а `app/page` собирает `ChatSidebar`.
- `@/components/QueryProvider`: существующий временный публичный client entry до 054. UI может пользоваться им; shared/query не импортирует conversation.

## Наблюдаемое поведение

| Сценарий | Контракт |
| --- | --- |
| Выбор/возврат | target, epoch, mobilePanel, focus и draft действуют по исходным правилам |
| Отправка | Enter/Shift+Enter/IME, 4096 code points, значимые пробелы, pending/accepted/not_sent/unknown и отсутствие автоповтора |
| История | recovery/refetch, empty/error/loading/refreshing и scroll anchor сохраняются |
| Представление | text rendering без HTML-инъекции, ARIA labels, роли, keyboard и SCSS без визуального редизайна |

Тесты используют публичные входы нового модуля после переноса; HTTP route и server actions не меняются.
