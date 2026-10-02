# Исследование получателя

**Дата**: 2026-10-02. Только официальные источники; код и реальные уведомления не запускались.

## Факты провайдера и выбор

[ReceiveNotification](https://green-api.com/telegram/docs/api/receiving/technology-http-api/ReceiveNotification/) возвращает один head и допускает timeout5–60 сек; [DeleteNotification](https://green-api.com/telegram/docs/api/receiving/technology-http-api/DeleteNotification/) использует receiptId, false может обозначать уже отсутствующее уведомление или неверный id. Поэтому HTTP200 недостаточен, следующий HEAD сравнивается прежде нового удаления. [HTTP API](https://green-api.com/telegram/docs/api/receiving/technology-http-api/) описывает FIFO, повтор до удаления и ограниченную очередь; это не долговечный журнал приложения. [Лимиты](https://green-api.com/telegram/docs/api/ratelimiter/) receive/delete100/сек на инстанс; выбран консервативный общий стартовый бюджет 50/сек и backoff, без изменения GetChats политики 014.

[Incoming](https://green-api.com/telegram/docs/api/receiving/notifications-format/incoming-message/Webhook-IncomingMessageReceived/) содержит instance identity, тип чата и sender metadata. [Chat id](https://green-api.com/telegram/docs/api/chat-id/) различает positive personal/negative group. [Типы событий](https://green-api.com/telegram/docs/api/receiving/notifications-format/type-webhook/) включают также служебные события. Это обосновывает отдельную validated ignored ветку, а не wildcard text cast; она не позволяет скрыть malformed известный message.

| Вариант                                        | Плюсы                                             | Риски                                                | Решение                |
| ---------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- | ---------------------- |
| ACK после stream write                         | Проще                                             | Сервер не знает, что браузер применил событие        | Отклонён пользователем |
| HTTP ACK после обработки                       | Контроль до Delete, повтор применяем идемпотентно | Browser memory не durable; потеря после ACK возможна | Согласован             |
| Registry по scope                              | Простой Query ключ                                | Несколько сессий читают одну очередь конкурентно     | Не подходит            |
| Registry по instance + server capability/epoch | Один reader/send, isolate session                 | Нужны lease/grace и cleanup                          | Выбран                 |
| DB/broker replay                               | Восстановление журнала                            | Объём/сервисы не приняты пользователем               | Исключён               |

## Обоснование lifecycle

Однопроцессный Node registry использует native crypto randomBytes, AbortSignal и timers [Node 24 crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptorandombytes-size-callback), [Node 24 globals](https://nodejs.org/docs/latest-v24.x/api/globals.html#class-abortsignal). Новые зависимости не нужны. Не применять shared registry к serverless/worker pool; [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting) допускает streaming, но конфигурацию proxies необходимо проверять отдельно.

Числа 5/8/10 сек и limited retries — параметры проекта, не обещания provider. Abort timeout может оставить неопределённый удалённый эффект, поэтому новая ownership ждёт локальный drain, а сообщения не выдаются за exactly-once. Captured cookie expiry проверяется независимо от browser connection. Existing logout/end-session ныне только удаляют cookie: план добавляет revoke matching scope до удаления, иначе уже открытый SSE живёт с захваченными credentials.

## Источники существующего проекта

Прочитаны session.ts/get-query-scope.ts, create-query-session.ts, handle-chats-request.ts, get-chats.ts, constants HTTP/API/routes, integration/query Playwright configs. Cookie encrypted HttpOnly86400sec, Query scope HMAC включает expiresAt, но queue owner ключ idInstance. GetChats retry429 не копируется механически в Receive/Delete. Проверки используют существующий Playwright 1.63 и fake fetch/deferred promises/clock, без реального Delete или установки пакетов.

Открытых продуктовых вопросов нет; эксплуатация требует user settings из quickstart. Runtime correctness/TDD ещё NotRun.

## Настройки и совместимость формата

[GetSettings](https://green-api.com/telegram/docs/api/account/GetSettings/) документирует typeInstance, webhookUrl и incoming/outgoing toggles. Поэтому preflight читает этот метод один раз после резервирования; existing getAccountSettings adapter их отбрасывает при profile normalization. Проблема настроек не приводит к автоматическому исправлению API. Пустой успешный Receive body — нормальный empty result, не JSON parsing failure.

В примере ReceiveNotification отсутствует chatType, хотя canonical IncomingMessageReceived описывает этот discriminator. Source разница явно известна; нельзя молча угадывать личный/бот/group тип по цифрам. План использует явный chatType=user из canonical event; фактический формат проверяется в операторской приёмке после авторизации. Если provider действительно присылает другой shape, исправление рассматривается до реализации соответствующего адаптера и не выдаётся за подтверждённую совместимость.

Status normalizer принадлежит 022, pure merge/earlyfacts/issues —019, наблюдаемые статусы/ошибки —024.022 не импортирует несуществующий runtime024; spec024 является источником согласованных enum/правил.
