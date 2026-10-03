# Research 048: модуль списка чатов

Дата: 2026-10-04. Сейчас `lib/chats` смешивает чистую нормализацию/ID, provider options, браузерный fetch, Query error, session overlay и React hooks. Пять компонентов списка живут в `components`, а `ChatUnreadBadge` используется также в conversation. `ChatListPanel` уже отделяет Query от `ChatList`/`ChatListItem`, передавая готовые записи и действия; QueryProvider не импортирует chats. Подключение и память принадлежат существующему QuerySession; уведомления вызывают `chatsQueryOptions` через троттлинг. Чатовый HTTP route делегирует `handleChatsRequest`; provider adapter использует общий GREEN-API transport.

| Вариант | Преимущества | Издержки/риск | Решение |
| --- | --- | --- | --- |
| Перенести только UI | Малый diff | `lib/chats` и смешанный тип server/client остаются | Не выбран |
| Разделить model/application/server/ui, перенести UI, badge в shared/ui | Явный граф и публичные входы, текущие runtime-политики сохраняются | Много consumers/test imports; нужен полный regression и карта типов | Выбран |
| Переписать Query/cache/provider одновременно | Можно сократить старые API | Риск гонок, повторов и изменения сроков cache; нет новой функции | Не выбран |

`ChatSidebar` по карте 035 принадлежит chats/ui как композиция account/search/list без знания их internals. `ChatUnreadBadge` доказанно общий с `ConversationBackButton` и переходит в shared/ui. `QueryProvider` и conversation/unread остаются у своих задач 049/054; chats использует существующий публичный `@/components/QueryProvider`, а не внутренний файл. Его перенос без выделения feature-specific `createConnectionSession` привёл бы к обратной зависимости shared→conversation; убрать переходный вход предстоит в 049/054. Текущие чтение provider, сохранённые факты, порядок и сроки cache не меняются. Константы разделяются по ответственности: query/overlay в application, scope validation и source в model; серверные credentials/options в server. Новых пакетов, данных и запросов нет.
