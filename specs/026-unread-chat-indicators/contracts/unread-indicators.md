# Contract: Query unread и отображение

1. recordIncomingUnread({ session, chatId, idMessage }) вызывается только после успешной валидации incoming в applyNotification; синхронно до успешного результата/ACK.
2. setReadableConversation({ session, chatId }) меняет видимую переписку, очищает её unread; null отключает автоматическое прочтение. Повтор с неизменными данными не публикует новую запись.
3. Дедупликация идёт по паре chatId/idMessage; повтор receiptId не является новой сущностью, новый receipt с тем же сообщением тоже не увеличивает число.
4. useUnreadCounts подписывается на disabled memory Query, возвращает countsByChatId и total, закрытое подключение возвращает ноль.
5. useConversationReadState получает существующий paneRef и selected chatId/accessId. Effect/ResizeObserver/visibilitychange обновляют доступность чтения; cleanup снимает подписки и readableChatId. DOM API только в эффекте, SSR без обращения к document.
6. ChatUnreadBadge получает count и compact, ноль возвращает null, 100+ показывает 99+ с точным aria-label «Новых сообщений: N». ListItem и BackButton сохраняют прежние onClick и accessible названия; бейдж добавляет отдельное доступное описание.
7. Серверные контракты Receive/SSE/ACK/Delete не меняются. Невалидное событие не учитывается; история/отправка/статусы не вызывают recordIncomingUnread.
