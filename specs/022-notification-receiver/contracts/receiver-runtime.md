# Контракт единственного получателя инстанса

**Статус**: техническое решение 2026-10-02; CodeNotAuthorized; проверки NotRun.
HTTP и транспорт: [023 notification-http](../../023-notification-sse/contracts/notification-http.md).

## Право работы

`src/lib/notifications/receiver-registry.ts` экспортирует процессный registry; он хранится под versioned `Symbol.for` на `globalThis`, чтобы route modules одного Node-процесса использовали один объект. Это проектная мера, проверяемая интеграцией production build, а не гарантия для нескольких Node workers. Ключ очереди — точный проверенный `credentials.idInstance`, а не connectionScope. Второй token/scope того же инстанса не создаёт второго читателя.

Claim атомарно резервирует инстанс, создаёт `ownerEpoch` и случайный 32 byte base64url `ownerCapability`. Capability — секрет права работы только в памяти вкладки и сервера, не GREEN-токен; URL, журналы, browser storage и SSE payload его не содержат. Сервер связывает его с проверенными credentials, scope и captured expiresAt. Сравнение capability не раскрывает текущего владельца. Новая HMR generation должна корректно revoke/drain старую entry; независимый module-level Map недопустим. Несколько route imports используют тот же registry. Авторизация cookie и сравнение scope предшествуют каждому HTTP действию.

Состояния registry: `claimed → attached → grace → revoked/draining → removed`; attached может быть `receiving`, `awaiting_ack`, `deleting`, `recovering_delete`, `retrying`, `paused`. После опубликованного успешного claim отсутствие подключения stream освобождает owner после 10 сек или срока сессии, что наступит раньше. В attached expiry проверяется таймером и перед каждой внешней операцией; heartbeat не продлевает cookie. Grace 10 сек после disconnect сохраняет старый capability, но receive/send и новые delete запрещены. Reconnect с ним возвращает attached и повторяет неприменённую delivery; другая вкладка получает busy, не перехватывает lease автоматически. Старый close callback проверяет stream generation и не отсоединяет новый поток.

Authenticated explicit release и server session expiry немедленно отзывают право; browser Query session close начинает best-effort release и abortstream, а бездоставленного release server закрывает право по disconnect/grace/expiry, не обещая мгновенной удалённой отмены. Registry остаётся draining до локального завершения всех начатых provider promises; только затем разрешён новый claim. Abort не доказывает отмену удалённого эффекта. Активный LogoutButton передаёт scope/capability headers. Logout до удаления cookie отзывает owner только после проверки cookie, scope и matching capability. Инактивная вкладка без capability не вызывает explicit revoke другой вкладки. Удаление общей cookie естественно приводит активную вкладку к 401 при следующем auth request; это не право выполнять чужой release. End-session GET без capability лишь удаляет cookie; captured expiry, stream disconnect или provider auth failure закрывают registry. Чужой scope не освобождает другую вкладку. Credentials и pending события удаляются после draining. Нет таймера бессрочного хранения отсоединённой сессии.

## Публичные операции runtime

Все аргументы auth context построены сервером; браузер не задаёт credentials или expiresAt. Для lifecycle используются `claimOwner(context)`, `attachOwner(context, sink)`, `detachOwner(context, streamGeneration)`, `ackDelivery(context, deliveryId)`, `releaseOwner(context)` и `revokeOwner({idInstance, connectionScope, ownerCapability})`. Context: `{credentials, connectionScope, expiresAt, ownerCapability?}`. Sink принимает нормализованные delivery/state events, а не сырой provider body. Dependency injection: fetch, now, sleep, random, scheduler; Request/Response не нужны pure registry.

Сервер отправки 020 использует ровно:

```ts
tryAcquireSend({ credentials, connectionScope, ownerCapability, attemptId, now? })
// {kind:'ok', release:()=>void}
// | {kind:'not_owner'} | {kind:'send_in_progress'}
// | {kind:'receiver_not_active'}
```

`ok` требует matching capability/scope, неистёкшую captured session, attached stream и отсутствие pause; один локальный Send lock на инстанс. release idempotent, вызывается handler finally после локального settle upstream. attemptId — correlation, не provider idempotency и не основание автоматически повторять Send. Disconnect/timeout браузера не освобождает lock начатого серверного Send. Сначала проверяется owner, затем busy/active; никакой ошибки не раскрывает другой owner.

## Queue и ACK

Receive запрашивает одно событие с receiveTimeout 5 сек; deadline provider fetch 8 сек. Пустой ответ не вызывает Delete. Пока существует pending receipt, следующий Receive не выполняется, кроме проверки HEAD после неопределённого Delete. Registry хранит один `{receiptId, deliveryId, ownerEpoch, connectionScope, normalizedEvent, browserProcessed, deleteAttempts}`. receiptId — positive safe integer только server-side; idMessage — строка.

Случайный deliveryId соответствует ровно текущему pending receipt и owner epoch. В том же grace replay имеет тот же deliveryId. Новый owner получает новый deliveryId даже при повторе receipt. ACK допустим только active owner для текущего deliveryId; повтор ACK того же pending — idempotent, не параллелит Delete. Обработанный в памяти дубль позволяет браузеру ACK replay. Нельзя принимать произвольный receiptId, old epoch, foreign scope или ACK после revoke. Запись в SSE/heartbeat не является ACK.

Delete с проверенным receiptId допускается после browserProcessed и только при активном owner. ACK HTTP успех означает принятое подтверждение, а не завершённый Delete. Уже запущенный Delete может завершиться после disconnect; новый Delete без активного owner не начинается. Delete result=true завершает pending. result=false и потерянный ответ переводят в recovering_delete: после backoff следующий Receive проверяет HEAD. Тот же receipt сначала повторно проверяется и сверяется с нормализованным pending событием; несовместимая identity/body при том же receipt — pause/noDelete, старый ACK не разрешает удалять иной факт. Совпавший head оставляет pending и допускает повтор Delete по прежнему валидному ACK; другой receipt сначала становится новой validated delivery с новым ACK; empty означает отсутствие прежнего head, без утверждения причины/exactly-once. Нельзя удалить новый head по старому ACK. После трёх Delete attempts с повторяющимся прежним head — paused `delete_failed`; явное восстановление повторно валидирует HEAD, не ClearQueue.

## Ошибки и ограничения

Начало provider receive/delete операций одного runtime инстанса разнесено минимум на 20 мс; это консервативный бюджет максимум 50 запросов/сек суммарно. Транзиентные network/5xx/429 используют 1, 2, 4, 8, 10 сек nominal backoff с random multiplier[0.8,1], потолок 10 сек; это выбранные параметры приложения. Валидный Retry-After увеличивает ожидание, если требует провайдер; лимит 10 относится к локальной последовательности, не разрешает нарушать Retry-After. Нет tight loop при invalid response.

Invalid token/instance/authorization завершает только текущий scope по SessionQueryError018. Непустой webhookUrl и malformed/unverifiable head приостанавливают получение с безопасной ошибкой. Resume — явное действие через release+claim после исправления причины; owner не перехватывается другой вкладкой, активный reconnect с прежним cap не обходит pause. Диагностика содержит только stage/code/counters, не payload, URL с credentials, capability или реальные ids/text. Никакого SetSettings/ClearWebhooksQueue. Исчезновение процесса теряет память, удалённые события не восстанавливаются.

## Read-only preflight

После атомарной резервации, до публикации capability и начала Receive, выполнить один server-only `GetSettings` на owner epoch, общий deadline 8 сек, без скрытого повторного GetAccountSettings. Документированные обязательные поля: typeInstance=telegram, webhookUrl пустая строка, incomingWebhook=yes. Existing getAccountSettings.ts возвращает лишь authorized profile и не предоставляет эти настройки.

Непустой URL/отключённые incoming — `notifications_not_configured`; невыполненный preflight отзывает непубликованную резервацию после локального drain, Receive/Delete не выполняются. Сетевая ошибка/429/5xx preflight даёт безопасный retry_later/rate_limited/service_unavailable; пользовательский claim retry явный, нового tight loop нет. Missing/invalid known fields — invalid_upstream_response, не «настройка точно правильная». Missing outgoing toggles не блокируют входящие/Send: сохраняется только безопасный диагностический flag для 024, пользователь включает их вручную. Provider settings/URL/token/raw body клиенту не возвращаются. Claim без опубликованного owner не допускает stream/send/ACK.

Settings проверены один раз в начале, а не постоянно: remote изменение webhookUrl позже может дать Receive400, который приостанавливает runtime. Не вызывать SetSettings/ClearQueue. Настройки проверяются по официальному [GetSettings](https://green-api.com/telegram/docs/api/account/GetSettings/), это не getAccountSettings profile из 013.
