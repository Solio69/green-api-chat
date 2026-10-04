# HTTP guards contract 038

Публичный серверный вход: `@/server/http`. Не импортируется клиентом.

```ts
isSameOrigin(request: Request): boolean
readConnectionScope(request: Request): string | null
isJsonMediaType(request: Request): boolean
readBoundedJsonBody({ request, maxBytes, contentLengthPolicy }): Promise<JsonBodyResult>
readUnboundedJsonBody(request: Request): Promise<{kind:'ok',value:unknown}|{kind:'invalid_body'}>
jsonNoStore({ body, status }): Response
```

`isSameOrigin` сравнивает с `request.headers.Host` при наличии, иначе с `new URL(request.url).origin`. Прокси-заголовки не дают альтернативного источника; malformed Host не разрешает fallback. Политика применимости и точная позиция в pipeline остаются у handler.

`readBoundedJsonBody` проверяет JSON media type до чтения, затем policy `ignore | reject_invalid_or_excess` для Content-Length. При превышении реально прочитанных байтов возвращает `too_large`; при отсутствии body, ошибке чтения/декодирования/парсинга — `invalid_body`. На size/read error выполняет `reader.cancel()` с подавлением только ошибки отмены и `releaseLock()` в finally. Для notification precheck заголовка invalid/declared oversize = `invalid_body`, как и прежний 400. Для send заголовок игнорируется, `too_large` отображается в 413, все остальные ошибки — 400. В обоих случаях провайдер не вызывается. Парсер возвращает `unknown`; DTO валидатор отдельный.

`readUnboundedJsonBody` не вызывает Content-Type guard и не устанавливает лимит; это эквивалент `request.json()` с catch. Recipient отдельно вызывает `isJsonMediaType`, history нет. Login сохраняет чтение raw text и byte check в `resolveLogin`, используя только media type и response helper.

`jsonNoStore` не добавляет поля в body и не меняет статус. В send handler результат после начала dispatch остаётся `outcome=unknown` при неопределённости; helper об этом не знает. URL/методы/headers/status/JSON/error order остаются согласно [матрице](../research.md).
