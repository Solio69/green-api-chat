# HTTP contract: POST /api/messages

**Источник**: согласованная [spec](../spec.md); ownership определяется
[022](../../022-notification-receiver/contracts/receiver-runtime.md) и
[023](../../023-notification-sse/contracts/notification-http.md).
Имена экспортов и заголовков согласованы между авторами технического комплекта.

## Запрос и порядок

Same-origin POST, Content-Type:application/json; cookie передаётся браузером,
X-Connection-Scope — текущий scope, X-Chat-Owner — capability рабочей вкладки.
Тело содержит только chatId, message, attemptId; лишние поля, неправильные типы
и отсутствие обязательного значения возвращают invalid_request. attemptId — UUID
локального действия, не секрет и не ключ GREEN-API идемпотентности.
chatId проходит общий isPersonalChatId из src/lib/chats/validate-chat-id.ts:
непустая trimmed строка без control characters, без leading '-' и @c.us/@g.us.
Numeric conversion/positive regex и дополнительный GetChats lookup не вводятся;
наличие получателя подтверждает источник выбора, upstream проверяет отправку.
Сервер дополнительно отклоняет credential-containing chatId через тот же
isSafeIdentifier до dispatch; invalid_request/not_sent, без echo значения.

POST требует Origin: валидный HTTP(S) origin без path/query/fragment, совпадающий
с фактическим origin назначения запроса: протокол из request.url и Host (если Host отсутствует в обычном Request тестового стенда — host из request.url). Missing/null/invalid/foreign Origin возвращает
403 invalid_request/not_sent до чтения body, резервирования lease и любого
provider эффекта. Cookie сохраняется; Origin не берётся из произвольных
X-Forwarded-* headers. JSON и HttpOnly-cookie сами по себе эту проверку не заменяют.
Это тот же guard, что mutating POST 023; существующие auth/chats API не меняются.

Проверки: Origin → конфигурация → cookie/expiry → scope → bounded JSON/поля → owner+send
lease → проверка отмены до dispatch → единственный SendMessage → finally release.
Фактический байтовый лимит — 65536. Некорректный media type возвращает 400;
body больше лимита — 413 invalid_request без вызова поставщика. Вход/поиск и их
существующий предел не изменяются. Пустой и whitespace-only текст не отправляется;
допустимый исходный текст передаётся без trim/нормализации.

В Next.js Request.url может нормализовать loopback host, поэтому сравнение
не опирается только на внутренний URL. Некорректный Host не допускает fallback
для прохождения проверки; произвольные X-Forwarded-* заголовки не используются.
Эта техническая граница соответствует проверенному guard истории018;
feature остаётся CodeNotAuthorized, исполняемые проверки NotRun.

## Ответ

Успех HTTP 200, Cache-Control:no-store:

```json
{
  "status": "ok",
  "connectionScope": "<opaque-scope>",
  "chatId": "<personal-chat-id>",
  "attemptId": "<attempt-uuid>",
  "idMessage": "<provider-message-id>"
}
```

Значения примера — обозначения, не реальные реквизиты. В DTO нет времени
провайдера: SendMessage не возвращает timestamp. Отображение local acceptedAt
создаёт 021 и помечает его как локальное время принятия.

Ошибка: `{status:'error',code,outcome:'not_sent'|'unknown'}`; no-store. Код не
содержит upstream URL, description, текст сообщения, token или idInstance.

| Условие                                                    | HTTP / code             | outcome  | Cookie / внешний эффект                                         |
| ---------------------------------------------------------- | ----------------------- | -------- | --------------------------------------------------------------- |
| Конфигурация отсутствует                                   | 503 server_unavailable  | not_sent | 0 вызовов                                                       |
| Origin missing/null/invalid/foreign                        | 403 invalid_request     | not_sent | Cookie сохраняется; body/lease/provider не затрагиваются        |
| Cookie отсутствует/повреждена/истекла                      | 401 session_required    | not_sent | Очистить негодную cookie, 0 вызовов                             |
| Scope отсутствует/неверного формата; некорректные поля     | 400 invalid_request     | not_sent | Cookie сохраняется, 0 вызовов                                   |
| Scope не совпадает                                         | 409 connection_changed  | not_sent | Cookie сохраняется, 0 вызовов                                   |
| Body превышает 65536 байт                                  | 413 invalid_request     | not_sent | 0 вызовов                                                       |
| Proof отсутствует/чужой/просрочен                          | 409 not_owner           | not_sent | 0 вызовов; не session failure                                   |
| Lease detached/paused                                      | 409 receiver_not_active | not_sent | 0 вызовов; не session failure                                   |
| Отправка уже выполняется                                   | 409 send_in_progress    | not_sent | 0 новых вызовов; не session failure                             |
| Provider 401/403, однозначный auth/state отказ             | 401 session_required    | not_sent | ClearSession; без дополнительного GetStateInstance              |
| Подтверждённый provider 400 validation/отказ               | 400 upstream_rejected   | not_sent | Без повтора; cookie сохраняется, кроме доказанного auth failure |
| Provider 429 или документированное rate_limit_exceeded     | 429 rate_limited        | not_sent | Без повтора; cookie сохраняется                                 |
| Разрыв/тайм-аут/5xx/redirect/неверный ответ после dispatch | 502 outcome_unknown     | unknown  | Без повтора; cookie сохраняется                                 |
| Ошибка cleanup/внутренняя до dispatch                      | 503 service_unavailable | not_sent | Успешное завершение сессии не заявляется                        |
| Ошибка cleanup после неопределённого dispatch              | 502 outcome_unknown     | unknown  | Исход не понижается до доказанного not_sent                     |

Классификация однозначного отказа требует проверяемого ответа; непризнанный
payload не доказывает отказ и возвращает unknown. Клиентский потерянный HTTP-ответ
сам по себе unknown, независимо от того, что сервер успел получить.

## Provider adapter и серверный lock

Accepted idMessage проверяется src/lib/green-api/safe-identifier.ts
isSafeIdentifier({value,secrets}): непустая строка без краевых пробелов/control
characters, без raw/encodeURIComponent вариантов серверных реквизитов внутри
значения. Helper чистый, не импортирует сессию и не сериализует secrets; caller
adapter вычисляет запрещённые значения на сервере. Не вводится positive numeric
regex idMessage. Небезопасный idMessage после dispatch даёт unknown, не DTO с
секретом. Исходный user-authored message этим фильтром не изменяется.
Helper создаётся в 020 и не является prerequisite для 019/022: более ранние
шаги используют существующий privacy pattern 014, без импорта будущих файлов 020.

src/lib/green-api/send-message.ts экспортирует
sendMessage({credentials,chatId,message,fetcher?,signal?}); таймер 10000 ms,
fetch POST JSON только chatId/message, cache:no-store, redirect:error. Вызывается
один раз. После начала внешнего вызова caller abort не освобождает lock до
settlement; попытка завершится ответом либо server deadline. Возвращает discriminated
результат ok/idMessage, подтверждённый отказ или outcome_unknown.

src/lib/sending/handle-send-request.ts принимает request/context/send/clearSession
и tryAcquireSend dependency; route src/app/api/messages/route.ts связывает
реальные cookie/scope/registry. Runtime Node, не Edge.

tryAcquireSend({credentials,connectionScope,ownerCapability,attemptId,now?})
из src/lib/notifications/receiver-registry.ts возвращает
{kind:'ok',release:()=>void} либо not_owner/receiver_not_active/send_in_progress.
Release идемпотентен и выполняется в finally, не обработчиком disconnect.
Подтверждённый valid idMessage сохраняется как accepted до cleanup; исключение
release/internal cleanup не превращает установленное принятие в unknown и не
стирает DTO. Release должен быть безопасным/идемпотентным; при неожиданной ошибке
cleanup известный результат сохраняется, дальнейший доступ не обходится.
Runtime остаётся по инстансу даже при смене owner, пока локальный вызов не settled.
Нельзя обещать отмену удалённого принятия при локальном deadline.

## HTTP методы и подтверждения

GET/PUT/PATCH/DELETE/HEAD получают стандартный Next 405 без provider dispatch;
OPTIONS — framework Allow без отправки. JSON error contract относится к POST.
401 session_required и 409 connection_changed клиент передаёт существующему
session.handleSessionError; ownership/busy 409 не закрывают Query/cookie.
Ни один HTTP-успех не вызывает DeleteNotification и не подделывает delivered/read.

## Проверка

После разрешения кода: HTTP cookie/scope/proof/методы/body, original text/Unicode,
late response и только один external call. Тайм-аут с сервером, принявшим текст,
возвращает unknown; count вызовов = 1. Все значения фиктивные. Acceptance: NotRun.
