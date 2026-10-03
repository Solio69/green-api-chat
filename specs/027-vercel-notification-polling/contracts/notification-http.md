# HTTP contract

Все маршруты POST, same-origin, cookie, X-Connection-Scope, JSON, no-store. runtime nodejs, force-dynamic, maxDuration20. Тело ограничено существующим MAX_REQUEST_BYTES.

| Route | Body | Success |
| --- | --- | --- |
| /api/notifications/settings | {} | status ok, connectionScope, outgoingEnabled boolean |
| /api/notifications/receive | {ownerEpoch:string} | status ok, connectionScope, delivery:null или NotificationDelivery, ackToken:null или signed proof |
| /api/notifications/ack | {ackToken:string} | status ok, connectionScope, deliveryId=ackToken |

Proof содержит только scope/receipt/expiry/purpose, проверяется доDelete на любом экземпляре с тем жеSESSION_PASSWORD. Чужой scope/подделка/expiry =>409 delivery_changed без удаления. InvalidOrigin403, absentSession401+clearCookie, changedScope409, malformed400, wrongMethod405, config503. Upstream auth401, invalid502 pause, temporary503 с Retry-After при наличии. Receive neverdelete. ACK false: следующий receive5 проверяет голову; null/другойreceipt => success, тотже => retry_later503. Не удалять новую голову. Receive invalid body/event => no delete.

Send /api/messages сохраняет Origin/cookie/scope/body/outcome guards, no automaticretry; больше не проверяет server lease. Claim/stream/release удалены, их URL не часть API.
