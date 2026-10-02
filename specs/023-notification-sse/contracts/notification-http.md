# HTTP право работы и SSE

**Статус**: выбранный технический контракт; CodeNotAuthorized, проверки NotRun.
Registry/guards: [022](../../022-notification-receiver/contracts/receiver-runtime.md).

Same-origin requests используют существующую HttpOnly cookie и `X-Connection-Scope`. Owner operations дополнительно требуют `X-Chat-Owner: <opaque capability>`; клиент хранит его лишь в памяти текущего подключения. Native EventSource не используется, потому что ему нельзя задать необходимые headers. Используется fetch ReadableStream, credentials='same-origin', cache='no-store'. Capability/GREEN token не помещаются в query parameters. Не включать CORS.

| Route                           | Body/headers                              | Успех                                                                                            |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| POST /api/notifications/claim   | JSON {}; scope; новый claim без owner     | 200 `{status:'ok',connectionScope,ownerCapability,ownerEpoch}`                                   |
| GET /api/notifications/stream   | scope + owner                             | 200 UTF8 text/event-stream                                                                       |
| POST /api/notifications/ack     | JSON `{deliveryId:string}`; scope + owner | 200 `{status:'ok',connectionScope,deliveryId}` — ACK принят, не подтверждение Delete             |
| POST /api/notifications/release | JSON {}; scope + owner                    | 200 `{status:'ok',connectionScope}` — matching owner отозван; повтор своего release идемпотентен |

Read-only preflight022 до claim success: ошибка конфигурации освобождает непубликованную reservation после drain;503 notifications_not_configured, noReceive/Delete. Отсутствующие outgoing toggles diagnostic не отключают Send.

Cookie отсутствует/истекла/invalid upstream auth:401 `{status:'error',code:'session_required'}`; clear cookie и SessionQueryError018. Действующая cookie с иным requested scope:409 `connection_changed`, общий close обработчик 018. Неверное тело/headers/type/content-length:400 `invalid_request` без upstream. Для POSTclaim/ACK/release Origin обязателен: HTTP(S) origin без userinfo, пути кроме корня, query и fragment; parsedOrigin.origin должен точно совпадать с фактическим origin назначения запроса: протокол из request.url и Host (если Host отсутствует в обычном Request тестового стенда — host из request.url). Отсутствующий, null, невалидный или чужой Origin возвращает403invalid_request до чтения body, lease mutation и provider effect. GETstream не требует Origin: он защищён cookie, scope/capability headers и отсутствием CORS. Существующие cookie/auth semantics не меняются. Body reading соблюдает существующий 8192-byte limit. Неверный метод 405. JSON errors не включают capability, credentials или provider body.

Ownership409 не закрывает Query/cookie:

| Code                | Значение / реакция                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| ownership_busy      | Другой owner или draining; явное ограничение и retry пользователя, без автозахвата                             |
| not_owner           | Capability отсутствует/не совпал/отозван; отправка/ACK не разрешены                                            |
| receiver_not_active | Нет attached здорового stream или pause; Send запрещён                                                         |
| stream_already_open | Matching owner уже attached; второй stream не заменяет первый                                                  |
| delivery_changed    | ACK не соответствует текущему pending; не Delete; клиент завершает старую попытку и следует актуальному stream |

Root-approved server Send guard020 использует тот же X-Chat-Owner; receiptId и instance id клиент не предъявляет для удаления. Claim является cookie-authorized созданием capability, не передачей provider secret. Прямой Send из второй вкладки отвергается сервером даже при подделанном client UI состоянии.

Все JSON no-store. Stream: `Content-Type:text/event-stream; charset=utf-8`, `Cache-Control:no-cache, no-transform`, `X-Accel-Buffering:no`; force-dynamic Node runtime, без Content-Length и cache. Next app обслуживает stream одним Node process. Provider timeout/paused после headers — нормализованное stream receiver_state/connection_error, а не попытка поменять уже отправленный HTTP статус. До headers ошибка session/config нормализуется JSON401/409/503. Никогда не выдавать provider URL.

Release старого чужого scope не отнимает owner нового подключения. Повтор уже состоявшегося matching release может дать idempotent200 при ещё валидной cookie/scope, но не возвращает чужой owner. Expired cookie всё равно 401. Resume pause после исправления — release+new claim явным действием, без SetSettings или очистки очереди. Technical DTO status/codes centralize в notifications types/constants, общие shared constants дополняются последовательно в назначенных шагах.

В Next.js Request.url может нормализовать loopback host, поэтому сравнение
не опирается только на внутренний URL. Некорректный Host не допускает fallback
для прохождения проверки; произвольные X-Forwarded-* заголовки не используются.
Эта техническая граница соответствует проверенному guard истории018;
feature остаётся CodeNotAuthorized, исполняемые проверки NotRun.
