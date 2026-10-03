# Контракт auth-модуля 036

| Entry | Экспорт | Среда |
| --- | --- | --- |
| `@/features/auth/model` | `AUTH_QUERY`, `HOME_RESULT_KIND` | чистый, без cookie/env/React |
| `@/features/auth/application` | `resolveHome`, `resolveLogin`, типы результатов | серверная композиция; injected provider/session operations |
| `@/features/auth/server` | `AUTH_CONFIG`, `IS_PRODUCTION`, `AUTH_ERROR_MESSAGE`, `getQueryScope`, `handleLoginRequest` | только server routes/pages |

`src/app/api/auth/login`, `logout`, `end-session` сохраняют путь,
метод, JSON/redirect и очистку cookie. Остальные routes сохраняют
проверку сессии, читая новые public auth entries. `src/app/login/page`
импортирует модельную причину access_lost, не server config.

`src/lib/auth/session.ts` временно остаётся серверным входом до 037.
Его `openSession`, `readCredentials`, `saveCredentials`,
`hasSessionPassword` и `SessionPayload` не меняют контракт. Он может
импортировать точный auth/server config, но ни один client component
не импортирует session/server. `getQueryScope` импортирует type
SessionPayload и текущий chats config до 037/048; этот переход
документирован в карте 035 и не выдаётся за конечный слой.

После 036 не остаётся импортов пяти старых auth-файлов и
бессрочных compatibility barrels. В 045 переносится UI авторизации
и разделяется поведение LoginForm; в 037 — cookie runtime.
