# Server session contract 037

Публичный server entry: `@/server/session`.

```ts
readRequestSession({ store, password, production, now? }): Promise<SessionReadResult>
readPageSession(): Promise<SessionReadResult>
readRouteSession(): Promise<SessionReadResult & { clearSession(): Promise<void> }>
openSession({ store, password, production }): Promise<IronSession<SessionPayload> | null>
saveCredentials({ session, credentials, now? }): Promise<void>
readCredentials({ session, now? }): InstanceCredentials | null
hasSessionPassword(password): password is string
```

`readRequestSession` читает только переданный `CookieStore`; если пароль не настроен, возвращает `unconfigured` без выдачи реквизитов. Истёкший/повреждённый payload — `missing`; `authorized` требует valid credentials и конечный future `expiresAt`. Он не вызывает `save`, `set` или `delete`, не продлевает срок. В двух параллельных вызовах нет общего mutable state. `readPageSession` не экспонирует write capability. `readRouteSession` захватывает request-local store и удаляет cookie только при вызове `clearSession` существующим handler. Отсутствие/ошибка сессии само по себе не вызывает удаление.

В consumer adapter `configured` и `context` сохраняют прежние поля. `messages/route.ts` использует `readRouteSession` напрямую, без импорта `notifications`. `handleNotificationRoute` единственный получает `process.env.SESSION_PASSWORD` для ACK proof; сырой пароль не включается в `SessionReadResult`, props или HTTP response. `login` сохраняет прежнюю write path. Все HTTP-методы, URL, статусы, JSON и заголовки остаются прежними; изменения error mapping относятся к 038.

Проверка: unit Red/Green по трём веткам, expiry, двум cookie stores, read-only; существующие integration и production E2E по HTTP-ответам, cookie и редиректам.
