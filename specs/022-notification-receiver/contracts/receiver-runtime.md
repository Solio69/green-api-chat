# Runtime получения уведомлений

Действующий контракт: [027 HTTP](../../027-vercel-notification-polling/contracts/notification-http.md).
Каждый settings/receive/ACK — независимый POST Next.js Node handler с cookie,
Origin и connectionScope guards. Сервер читает ReceiveNotification с timeout5;
нормализует событие и выдаёт подписанный receipt/scope/expiry proof. Без ACK
DeleteNotification не вызывается. Проверка proof выполняется другим экземпляром
с тем же SESSION_PASSWORD; registry, постоянный loop и server lease отсутствуют.
Receive/settings deadline8с; ACK до16с; maxDuration20с. Повреждённое событие
остаётся в очереди. При false delete проверяется только голова очереди.

Клиентский цикл и владение: [027 client](../../027-vercel-notification-polling/contracts/notification-client.md).
Функциональный слой022 сохраняет нормализацию, настройки и provider errors.
