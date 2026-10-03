# Data model

- ReceiverContext: cookie credentials (server only), connectionScope, expiresAt.
- NotificationDelivery: connectionScope, локальный ownerEpoch, deliveryId (proof), нормализованный event.
- AckProof payload: purpose, connectionScope, receiptId, expiresAt; HMAC; пять минут либо раньше expiry cookie.
- Browser owner: connectionScope + ownerEpoch, Web Lock release; в RAM вкладки.
- Pending ACK: delivery/proof в памяти вкладки до завершения; повтор получения dedup по существующим chatId/idMessage.
- Cookie/Query/messages/status/unread модели сохраняются. БД и server globals отсутствуют; fake provider state применяется только в тестах.
