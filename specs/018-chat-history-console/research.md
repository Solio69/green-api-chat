# Research: история выбранного чата в консоль

**Дата**: 2026-10-02. Технические решения согласованы до кода; актуальный контекст реализации сверяется с verification.md.

## Фактическая база

В проекте Next 16.3.7, React 19.3.0, Query 5.104.0, Node 24.x, iron-session 9.
QueryProvider создаёт один keyed экземпляр createQuerySession. getQueryScope
использует HMAC от idInstance/apiTokenInstance/expiresAt; expiry нельзя исключать.
useChats и route /api/chats уже реализуют scope/no-store/сессионные ошибки.
QueryCache использует общий SessionQueryError для ChatsQueryError и
HistoryQueryError; проверенные code/status задают единый lifecycle 401/409.
025 реализована и предоставляет target/accessId/selectionEpoch; история
использует accessId, без собственного выбора собеседника.

## Источник и ограничения

[GetChatHistory](https://green-api.com/telegram/docs/api/journals/GetChatHistory/)
повторно проверен 2026-10-02: POST с chatId/count, пример последних десяти; возвращаются направления,
idMessage, время, текстовые/нетекстовые типы. Cursor/offset не документированы.
[Ограничения](https://green-api.com/telegram/docs/api/ratelimiter/) задают для
GetChatHistory один запрос в секунду на инстанс. Поэтому быстрый выбор может
получить 429. Подгрузка отложена пользователем; count всегда 10.

## Варианты и решения

| Решение                    | Альтернатива                       | Выбор и основание                                                                                                   | Цена                                                     |
| -------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Один snapshot как весь кеш | Заменять data каждым ответом       | Отдельный временный request key и merged messages key: сохраняются известные/live данные и свежий ответ для консоли | Два назначения Query, snapshot не более одного ответа    |
| Свежесть по времени        | staleTime0 на общий chat key       | Новый accessId из 025 для каждого открытия, Infinity внутри этого accessId                                          | Нужно проверять поколение и дедупликацию                 |
| Сессионные ошибки          | Отдельная навигация внутри истории | Общий SessionQueryError/handler с сохранением 014                                                                   | Регрессия 014 и cleanup                                  |
| Ошибка 429                 | Много client retries или scheduler | Существующий read pattern: один повтор через 1100ms в общем 10sdeadline                                             | Повторное идемпотентное чтение, без изменения сообщений  |
| Удержание Query            | Стандартные пять минут gc          | messages gcInfinity до close, чтобы сохранять уже полученное при переключениях                                      | Память растёт в текущей сессии, постоянного хранения нет |

Root технически подтвердил эти решения; они не расширяют продуктовый объём.
Общий parser chatId сверён с 020: isChatId непустой trimmed/control-free string;
isPersonalChatId также исключает '-' и '@c.us'/'@g.us'.
[Официальный chatId](https://green-api.com/telegram/docs/api/chat-id/)
описывает private positive/group negative; opaque совместимость 014 не доказывает
существование/private, это подтверждают GetChats user/CheckAccount/provider.
Никакой Number-конверсии, strictnumericregex или phone alias sending.

## Query API и источники

POST Route Handler получает cookie браузера и проверяет Origin до тела и
поставщика. [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
описывает проверку source/target origin как дополнительную защиту. В текущем
браузерном контракте, сверенном с 020/023, missing/null/foreign/невалидный Origin
дают 403 invalid_request. Сравниваются разобранные origin, а не префиксы строки;
CORS не включается. Это минимальная проверка текущего обработчика, без нового
общего модуля или изменения сессии. Назначение берётся из фактического Host и
протокола request.url, без чтения произвольных X-Forwarded-* заголовков.
В установленном Next 16.3.7 next-url.js строки 15–20 нормализуют 127.0.0.1/::1
в localhost, а spec-extension/request.js строка 50 отдаёт нормализованный URL.
Поэтому request.url отдельно может расходиться с действительным браузерным
Origin. Это проверено real route E2E и отдельным NextRequest regression:
Host127/Origin127 допустим; Host127/Originlocalhost отклоняется.

[QueryOptions](https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/QueryOptions)
подтверждает gcTime/Infinity. [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient)
описывает immutable setQueryData и cancel/clear. Сверены установленные
node_modules/@tanstack/query-core/src/queryClient.ts, query.ts и removable.ts:
useQuery/QueryCache, счётчики завершений и удержание messages до close доступны
в 5.104.0. Обновлять библиотеку и менять политику списка 014 не требуется.

Источники установленных версий — package.json; авторизация и scope — текущий
src/lib/auth/get-query-scope.ts, session.ts; действия по Git — GIT_POLICY.md.
Новые пакеты, собственная БД, записи в Telegram и изменения UI не нужны.
