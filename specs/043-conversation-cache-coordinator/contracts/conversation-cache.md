# Contract 043: применение событий переписки

1. `applyConversationHistory({session,chatId,messages})` проверяет активность и принадлежность чату, применяет историю и публикует issues единожды. Успешная пустая история создаёт пустую модель, но не стирает накопленные сообщения.
2. `fetchAndApplyConversationHistory({session,chatId,signal,fetcher?})` получает и проверяет ответ через `fetchHistory`; перед записью отклоняет abort/закрытие; Query отменяет старый ключ при смене accessId. Возвращает нормализованный массив для Query state. Ошибка fetch/validation не изменяет message cache.
3. `applyAcceptedConversation({session,target,idMessage,text,acceptedAt})` объединяет принятое сообщение и временный чат с одной публикацией issues; caller уже подтверждает owner context. Не расширяет правила отправки.
4. `applyConversationDelivery({session,delivery,ownerEpoch,refreshChats?})` отбрасывает невалидный scope/owner; incoming синхронно записывает message, temporary chat и unread, status записывает статус/issue, ignored не пишет. Возвращает boolean для существующего ACK protocol. `refreshChats` вызывается только после успешного применения входящего.
5. `useChatHistory` только читает request state и message projection, выдаёт `refetch` и не подписывается на QueryCache ради merge. Query key, loading/error/result и повторное открытие остаются прежними.

Совместимые `applyHistoryMessages`, `addAcceptedMessage` и `applyNotification` можно оставить как переходные adapters для внешних тестов/потребителей; они не должны создавать второй путь применения в основном runtime. Все входы используют фиктивные данные в тестах.
