# Contract 044: общий Query lifecycle и composition

1. `createQuerySession({connectionScope,onSessionError?,fetcher?})` создаёт изолированный QueryClient и управляет active/subscribe/registerCleanup/retain/close/handleSessionError. Он не импортирует `chats`, `messages`, `unread` и не предоставляет chat-specific `options()`.
2. `chatsQueryOptions(session)` возвращает прежний ключ, timing/refetch/retry policy и queryFn с `fetchChats`/`reconcileSessionChats`; оба потребителя (`useChats`, notification refresh) используют эту функцию.
3. `configureConnectionMemory(client)` задаёт `skipToken`, `enabled:false`, GC Infinity и прежние запреты автоматического refetch для пяти типов памяти. Повторная конфигурация не меняет данные. `createConnectionSession` соединяет core и memory defaults для QueryProvider.
4. `close()` немедленно делает сессию неактивной, вызывает все cleanup callbacks даже при исключении, отменяет запросы и очищает весь QueryClient; повторный close идемпотентен. Поздний ответ не восстанавливает кеш.
5. Ключи всех проекций сохраняют scope. Read hooks скрывают данные после close; seen/unread и выбор сохраняют действующую семантику. Внешний HTTP/UI контракт и локальное хранение не меняются.
