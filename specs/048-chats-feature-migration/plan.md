# Implementation Plan: модуль списка чатов 048

**Spec**: [spec.md](spec.md). Дата: 2026-10-04. Полный цикл и commit/push `refactor` уже поручены.

## Summary

Перенести чистые правила в `features/chats/model`, Query/cache/browser fetch в `application`, React hooks и пять компонентов в `ui`, HTTP handler/provider entry в `server`. Разделить прежние `types.ts` и `constants.ts` по слоям. Общий `ChatUnreadBadge` перенести в `shared/ui`. Сохранить ответ API, query key/stale/gc/retry, overlay, ручное обновление, выбор, badge и DOM/SCSS.

## Основание и C1–C8

[Research](research.md) фиксирует три варианта и риски. C1 PASS: нет нового продукта/данных, границы определены. C2 PASS: задача только о списке, история/композер/уведомления сохраняют владельцев. C3/C4 PASS: пользователь разрешил полный цикл/commit/push. C5/C6 PASS: нет установки, БД и реальных credentials. C7 PASS: исходное покрытие подтверждается до переноса; новые Vitest/RTL тесты проверяются на старой реализации, искусственный Red не нужен. C8 PASS: без второго cache/store, существующий QuerySession используется как владелец.

## Модель и контракт

[Data model](data-model.md), [contract](contracts/chat-list.md), [quickstart](quickstart.md). `model` экспортирует PersonalChat, ChatsErrorCode type, normalizeChats, isChatId/isPersonalChatId, scope constants и источник локальных фактов. `normalizeChats` принимает локально описанную структурную пару credential strings без type-only импорта server get-state. `application` экспортирует session-chat-facts, chatsQueryOptions, fetchChats, ChatsQueryError и query config; UI hooks в `ui` используют действующий общий QueryProvider, список и панель читают их готовый результат. `server` экспортирует handleChatsRequest, getChats и server options/result type. У server нет импорта UI. `shared/ui` экспортирует badge. Client graph не достигает server runtime. `useChats` и `useSessionChatLabels` временно используют публичный index действующего QueryProvider; нейтральное размещение самого провайдера зависит от разделения feature-specific `createConnectionSession` в 049/054.

## Файлы

- Move/split `src/lib/chats/{constants,types,normalize-chats,validate-chat-id,session-chat-facts,fetch-chats,chats-query-options,use-chats,use-session-chat-labels,handle-chats-request}.ts` по четырём слоям; добавить по одному `index.ts` на слой и разделённые `types.ts`/`constants.ts`. Старый `lib/chats` удалить после обновления всех runtime/test imports. Уточнить карту 035: в неё не попал созданный позднее `chats-query-options.ts`, а физический перенос `session-chat-facts.ts` выполняется здесь после логической задачи 043.
- Move `src/components/{ChatList,ChatListItem,ChatListPanel,ChatListRecovery,ChatSidebar}/*` → `src/features/chats/ui`, `src/components/ChatUnreadBadge/*` → `src/shared/ui/ChatUnreadBadge`. Обновить SCSS `@use`, относительные и внешние импорты. Добавить `src/shared/ui/index.ts`.
- Обновить `src/app/page.tsx`, `/api/chats/route.ts`, `ChatWorkspace`, `ConversationBackButton`, shared Query/connection, auth scope, server/http, provider get-chats, history/messages/notifications/sending/conversation modules и Query fixture imports. `/api/chats/history` остаётся за history/conversation (049); его HTTP-контракт не меняется.
- Add `tests/unit/chat-list-model.test.ts` (overlay/unique/labels через QueryClient) и `tests/component/chat-list.test.tsx` (loading/empty/selected/unread/keyboard). Сохранить integration chat-query/chats-api/session-chat-facts/shared-http и Query/E2E chat-list/unread.

## Порядок и проверки

Точный baseline integration, Query и E2E; read-only анализ. Добавить регрессионные tests и подтвердить Green на старом коде; затем move/split с обновлением consumers, Green и Refactor. Для нового поведения, если оно потребуется, сначала test + поведенческий Red. Полные Vitest, typecheck/lint/styles/format, integration/Query/E2E запускать после серии правок (Playwright последовательно). Проверить граф, старые пути, diff/secret review; post-analyze; commit/push и обе GitHub CI jobs на кодовом и документационном SHA. Новых пакетов/операторских действий нет.

## Post-design C1–C8

PASS при сохранённом cache/HTTP/UI поведении, отсутствии client→server runtime и единственном владельце каждого слоя. Отклонений нет.
