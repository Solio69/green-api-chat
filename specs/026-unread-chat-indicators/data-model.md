# Data model: Счётчики

Ключ Query: ['chat-unread', connectionScope]. Memory defaults: skipToken, enabled false, gcTime Infinity, без refetch. Данные UnreadCache:

- seenByChatId: Readonly<Record<string, readonly string[]>> — обработанные входящие IDs, включая просмотренные сразу;
- unreadByChatId: Readonly<Record<string, readonly string[]>> — непрочитанные IDs;
- readableChatId: string | null — выбранная переписка, реально видимая пользователю.

Incoming: если ID уже seen, вернуть прежнюю запись; иначе добавить seen и при несовпадении readableChatId добавить unread. Visibility/open: обновить readableChatId и удалить только его unread. Hidden/list/close: readableChatId null; накопленные unread остальных сохраняются. Scope определяется ключом и QuerySession; закрытый session не допускает записи. UI вычисляет counts и total, не хранит отдельный дублирующий счётчик. История не пишет в эту сущность.
