# Модель клиентского получения

| Объект                   | Жизненный цикл                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| NotificationConnection   | Одна QuerySession; scoped controller state и event listeners; close очищает resources                |
| Owner memory             | Capability и epoch текущего claim; secret только in memory; canSend=false при disconnect/pause/close |
| Delivery attempt         | Одна validated deliveryId, processing/ACK retry; generation+scope guard; без receiptId               |
| Message facts            | Общий Query ключ 019 `(scope,chatId)`; live/history/accepted merge по idMessage                      |
| Local chat overlay       | Incoming displayLabel+actual chatId; union GetChats019, память scope                                 |
| Receiver/transport issue | Safe code/state текущего подключения, не failed всех исходящих                                       |

Полная переписка и overlay сохраняются до завершения Query scope по 019, ранние statusfacts ограничивает 024. Reload теряет память;10 fresh history и остаток очереди не обещают полный replay. Selection025 отдельно владеет выбором: notification A при выбранном B меняет только факты A.

Detailed state transitions and HTTP errors: [client](contracts/notification-client.md), [HTTP](contracts/notification-http.md). Никакой browser persistence, URL token или глобального singleton, переносящего чужой scope.
