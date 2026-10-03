# Data model 038: результат общих HTTP-проверок

`OriginResult = boolean`: true только для нормализованного HTTP(S) Origin без username/password/path/query/fragment и при точном совпадении с фактическим Host, если он задан; malformed Host — false. Отсутствующий Origin — false. Маршрут выбирает, когда эта проверка требуется.

`ScopeRead = string | null`: строка лишь при существующем заголовке и совпадении с текущим `SCOPE_PATTERN`; отсутствие/некорректность — null. Сравнение с connectionScope и HTTP mapping находятся в вызывающем обработчике.

`JsonBodyResult<T=unknown>` — discriminated union `{kind:'ok',value:T}` либо `{kind:'invalid_media_type'|'invalid_body'|'too_large'}`. `too_large` означает фактический stream > maxBytes; при notification invalid Content-Length или declared >limit обрабатывается как invalid_body по текущему 400. `contentLengthPolicy` задаётся явно; `ignore` не доверяет заголовку и продолжает считать фактические байты. `readUnboundedJsonBody` возвращает только `ok | invalid_body` и не ограничивает размер. Media type для history не обязателен, для recipient/login обязателен.

`jsonNoStore({body,status})` возвращает прежний JSON Response с `Cache-Control: no-store`. Модель не определяет shape `body`, status, порядок guards или провайдера: они принадлежат маршруту. Нет глобального состояния, хранения тела между запросами и новых DTO.
