# Data model 037: контекст серверного запроса

`SessionPayload = { idInstance, apiTokenInstance, expiresAt }` остаётся зашифрованным в существующей cookie. Формат и абсолютный 24-часовой срок не меняются.

`SessionReadResult` — discriminated union:

- `unconfigured`: секрет отсутствует/короче требуемой длины; `configured=false`, `context=null`;
- `missing`: секрет настроен, но cookie отсутствует, повреждена или истекла; `configured=true`, `context=null`;
- `authorized`: секрет настроен и payload валиден; `configured=true`, `context={credentials,connectionScope,expiresAt}`.

`credentials` — два действующих идентификатора подключения. `connectionScope` — прежний HMAC на id/token/expiresAt с секретом сессии; отдаётся как идентификатор подключения в текущем протоколе, но сам секрет не входит в результат. `expiresAt` — миллисекунды Unix и не продлевается чтением. Результат создаётся заново для каждого вызова, не хранится в process/global/React cache.

`RouteSessionRead` добавляет только `clearSession(): Promise<void>`, которое удаляет cookie из того store, который был прочитан для запроса. Page adapter возвращает лишь `SessionReadResult`; вызов удаления в Server Component невозможен через его API. Существующие handlers сами переводят result в старые HTTP-ответы и редиректы.
