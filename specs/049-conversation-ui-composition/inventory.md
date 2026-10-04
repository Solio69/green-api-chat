# Инвентарь 049

Источник: карта 035, сверена с рабочим деревом до реализации. Следующие 79 строк — точные исходные пути и целевые области. `app` остаётся на месте.

| Исходный путь | Цель | Действие |
| --- | --- | --- |
| `src/app/HomePage.module.scss` | `src/app` | adapt |
| `src/app/constants.ts` | `src/app` | adapt |
| `src/app/page.tsx` | `src/app` | adapt |
| `src/components/ChatHistoryPanel/ChatHistoryPanel.module.scss` | `src/features/conversation/ui/ChatHistoryPanel` | move |
| `src/components/ChatHistoryPanel/ChatHistoryPanel.tsx` | `src/features/conversation/ui/ChatHistoryPanel` | move |
| `src/components/ChatHistoryPanel/constants.ts` | `src/features/conversation/ui/ChatHistoryPanel` | move |
| `src/components/ChatHistoryPanel/index.ts` | `src/features/conversation/ui/ChatHistoryPanel` | move |
| `src/components/ChatHistoryState/ChatHistoryState.module.scss` | `src/features/conversation/ui/ChatHistoryState` | move |
| `src/components/ChatHistoryState/ChatHistoryState.tsx` | `src/features/conversation/ui/ChatHistoryState` | move |
| `src/components/ChatHistoryState/constants.ts` | `src/features/conversation/ui/ChatHistoryState` | move |
| `src/components/ChatHistoryState/index.ts` | `src/features/conversation/ui/ChatHistoryState` | move |
| `src/components/ChatWorkspace/ChatWorkspace.module.scss` | `src/features/conversation/ui/ChatWorkspace` | move |
| `src/components/ChatWorkspace/ChatWorkspace.tsx` | `src/features/conversation/ui/ChatWorkspace` | move |
| `src/components/ChatWorkspace/constants.ts` | `src/features/conversation/ui/ChatWorkspace` | move |
| `src/components/ChatWorkspace/index.ts` | `src/features/conversation/ui/ChatWorkspace` | move |
| `src/components/ChatWorkspace/use-workspace-focus.ts` | `src/features/conversation/ui/ChatWorkspace` | move |
| `src/components/ConversationBackButton/ConversationBackButton.module.scss` | `src/features/conversation/ui/ConversationBackButton` | move |
| `src/components/ConversationBackButton/ConversationBackButton.tsx` | `src/features/conversation/ui/ConversationBackButton` | move |
| `src/components/ConversationBackButton/constants.ts` | `src/features/conversation/ui/ConversationBackButton` | move |
| `src/components/ConversationBackButton/index.ts` | `src/features/conversation/ui/ConversationBackButton` | move |
| `src/components/ConversationBackground/ConversationBackground.module.scss` | `src/features/conversation/ui/ConversationBackground` | move |
| `src/components/ConversationBackground/ConversationBackground.tsx` | `src/features/conversation/ui/ConversationBackground` | move |
| `src/components/ConversationBackground/index.ts` | `src/features/conversation/ui/ConversationBackground` | move |
| `src/components/ConversationCloseButton/ConversationCloseButton.module.scss` | `src/features/conversation/ui/ConversationCloseButton` | move |
| `src/components/ConversationCloseButton/ConversationCloseButton.tsx` | `src/features/conversation/ui/ConversationCloseButton` | move |
| `src/components/ConversationCloseButton/constants.ts` | `src/features/conversation/ui/ConversationCloseButton` | move |
| `src/components/ConversationCloseButton/index.ts` | `src/features/conversation/ui/ConversationCloseButton` | move |
| `src/components/ConversationEmptyState/ConversationEmptyState.module.scss` | `src/features/conversation/ui/ConversationEmptyState` | move |
| `src/components/ConversationEmptyState/ConversationEmptyState.tsx` | `src/features/conversation/ui/ConversationEmptyState` | move |
| `src/components/ConversationEmptyState/constants.ts` | `src/features/conversation/ui/ConversationEmptyState` | move |
| `src/components/ConversationEmptyState/index.ts` | `src/features/conversation/ui/ConversationEmptyState` | move |
| `src/components/ConversationHeader/ConversationHeader.module.scss` | `src/features/conversation/ui/ConversationHeader` | move |
| `src/components/ConversationHeader/ConversationHeader.tsx` | `src/features/conversation/ui/ConversationHeader` | move |
| `src/components/ConversationHeader/constants.ts` | `src/features/conversation/ui/ConversationHeader` | move |
| `src/components/ConversationHeader/index.ts` | `src/features/conversation/ui/ConversationHeader` | move |
| `src/components/ConversationPane/ConversationPane.module.scss` | `src/features/conversation/ui/ConversationPane` | move |
| `src/components/ConversationPane/ConversationPane.tsx` | `src/features/conversation/ui/ConversationPane` | move |
| `src/components/ConversationPane/constants.ts` | `src/features/conversation/ui/ConversationPane` | move |
| `src/components/ConversationPane/index.ts` | `src/features/conversation/ui/ConversationPane` | move |
| `src/components/ConversationSelectionProvider/ConversationSelectionProvider.tsx` | `src/features/conversation/ui/ConversationSelectionProvider` | move |
| `src/components/ConversationSelectionProvider/constants.ts` | `src/features/conversation/ui/ConversationSelectionProvider` | move |
| `src/components/ConversationSelectionProvider/index.ts` | `src/features/conversation/ui/ConversationSelectionProvider` | move |
| `src/components/MessageBubble/MessageBubble.module.scss` | `src/features/conversation/ui/MessageBubble` | move |
| `src/components/MessageBubble/MessageBubble.tsx` | `src/features/conversation/ui/MessageBubble` | move |
| `src/components/MessageBubble/constants.ts` | `src/features/conversation/ui/MessageBubble` | move |
| `src/components/MessageBubble/index.ts` | `src/features/conversation/ui/MessageBubble` | move |
| `src/components/MessageComposer/MessageComposer.module.scss` | `src/features/conversation/ui/MessageComposer` | move |
| `src/components/MessageComposer/MessageComposer.tsx` | `src/features/conversation/ui/MessageComposer` | move |
| `src/components/MessageComposer/constants.ts` | `src/features/conversation/ui/MessageComposer` | move |
| `src/components/MessageComposer/index.ts` | `src/features/conversation/ui/MessageComposer` | move |
| `src/components/MessageComposer/use-message-composer.ts` | `src/features/conversation/ui/MessageComposer` | move |
| `src/components/MessageComposerFeedback/MessageComposerFeedback.module.scss` | `src/features/conversation/ui/MessageComposerFeedback` | move |
| `src/components/MessageComposerFeedback/MessageComposerFeedback.tsx` | `src/features/conversation/ui/MessageComposerFeedback` | move |
| `src/components/MessageComposerFeedback/constants.ts` | `src/features/conversation/ui/MessageComposerFeedback` | move |
| `src/components/MessageComposerFeedback/index.ts` | `src/features/conversation/ui/MessageComposerFeedback` | move |
| `src/components/MessageList/MessageList.module.scss` | `src/features/conversation/ui/MessageList` | move |
| `src/components/MessageList/MessageList.tsx` | `src/features/conversation/ui/MessageList` | move |
| `src/components/MessageList/constants.ts` | `src/features/conversation/ui/MessageList` | move |
| `src/components/MessageList/index.ts` | `src/features/conversation/ui/MessageList` | move |
| `src/components/MessageList/use-message-scroll.ts` | `src/features/conversation/ui/MessageList` | move |
| `src/components/MessageSendButton/MessageSendButton.module.scss` | `src/features/conversation/ui/MessageSendButton` | move |
| `src/components/MessageSendButton/MessageSendButton.tsx` | `src/features/conversation/ui/MessageSendButton` | move |
| `src/components/MessageSendButton/index.ts` | `src/features/conversation/ui/MessageSendButton` | move |
| `src/components/MessageStatusIndicator/MessageStatusIndicator.module.scss` | `src/features/conversation/ui/MessageStatusIndicator` | move |
| `src/components/MessageStatusIndicator/MessageStatusIndicator.tsx` | `src/features/conversation/ui/MessageStatusIndicator` | move |
| `src/components/MessageStatusIndicator/constants.ts` | `src/features/conversation/ui/MessageStatusIndicator` | move |
| `src/components/MessageStatusIndicator/index.ts` | `src/features/conversation/ui/MessageStatusIndicator` | move |
| `src/components/MessageStatusIssue/MessageStatusIssue.module.scss` | `src/features/conversation/ui/MessageStatusIssue` | move |
| `src/components/MessageStatusIssue/MessageStatusIssue.tsx` | `src/features/conversation/ui/MessageStatusIssue` | move |
| `src/components/MessageStatusIssue/index.ts` | `src/features/conversation/ui/MessageStatusIssue` | move |
| `src/components/NotificationNotice/NotificationNotice.module.scss` | `src/features/conversation/ui/NotificationNotice` | move |
| `src/components/NotificationNotice/NotificationNotice.tsx` | `src/features/conversation/ui/NotificationNotice` | move |
| `src/components/NotificationNotice/constants.ts` | `src/features/conversation/ui/NotificationNotice` | move |
| `src/components/NotificationNotice/index.ts` | `src/features/conversation/ui/NotificationNotice` | move |
| `src/lib/conversations/constants.ts` | `src/features/conversation/selection/model` | move |
| `src/lib/conversations/selection.ts` | `src/features/conversation/selection/model` | move |
| `src/lib/conversations/types.ts` | `src/features/conversation/selection/model` | move |
| `src/lib/history/normalize-history.ts` | `src/features/conversation/history/model` | move |
| `src/lib/history/validate-history-request.ts` | `src/features/conversation/history/model` | move |

Дополнительно переносятся семь provider-файлов, назначенных логическим 043/041, но физически оставшихся в `src/components`:

| Исходный путь | Цель |
| --- | --- |
| `src/components/MessageSendProvider/MessageSendProvider.tsx` | `src/features/conversation/ui/MessageSendProvider/` |
| `src/components/MessageSendProvider/constants.ts` | `src/features/conversation/ui/MessageSendProvider/` |
| `src/components/MessageSendProvider/index.ts` | `src/features/conversation/ui/MessageSendProvider/` |
| `src/components/NotificationProvider/NotificationProvider.tsx` | `src/features/conversation/ui/NotificationProvider/` |
| `src/components/NotificationProvider/constants.ts` | `src/features/conversation/ui/NotificationProvider/` |
| `src/components/NotificationProvider/context.ts` | `src/features/conversation/ui/NotificationProvider/` |
| `src/components/NotificationProvider/index.ts` | `src/features/conversation/ui/NotificationProvider/` |

Новые `src/features/conversation/ui/ConversationChatListPanel/{ConversationChatListPanel.tsx,index.ts}`, `src/features/chats/ui/types.ts` и изменённые `src/features/chats/ui/{ChatListPanel,ChatList,ChatListItem}` формируют односторонний UI contract. `QueryProvider` остаётся публичным переходным входом до 054: его перенос в `shared/query` требует сначала убрать feature-specific `createConnectionSession`. `SubmitButton` относится к shared/UI аудиту 054.

Потребители: `src/app/page.tsx`, `src/app/layout.tsx`, `src/features/chats/ui`, `src/components`, `src/lib/history`, `src/lib/messages`, `src/lib/unread`, тесты `tests/component`, `tests/integration`, `tests/query`, `tests/e2e` и их fixtures. Точный список импортов выявляется `rg` непосредственно перед переносом и проверяется повторно после него.
