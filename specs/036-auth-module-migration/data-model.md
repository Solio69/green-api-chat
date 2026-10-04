# Модель auth 036

`InstanceCredentials` и `SessionPayload` сохраняют текущую форму;
cookie-сессия живёт в `src/lib/auth/session.ts` до 037. Её
24-часовой срок, flags и формат не меняются. Публичная client-модель
не экспортирует credentials или cookie API.

`LoginResult`: текущие `status` и `body` для успеха, некорректного
запроса, временного отказа и отказа в доступе. `HomeResult`:
`login | end-session | retry | authorized` — существующие ветви;
повторная проверка при временной недоступности не очищает сессию.

`AUTH_QUERY` и `HOME_RESULT_KIND` — чистые auth/model константы.
`AUTH_CONFIG`, `IS_PRODUCTION`, `AUTH_ERROR_MESSAGE` — server-only
конфигурация. `connectionScope` остаётся результатом HMAC от данных
конкретной сессии, не заменяет HttpOnly cookie и не содержит сам
API-token. Детальный перенос и унификация контекста сессии — 037.

Инвариант миграции: смена import path не меняет наблюдаемые HTTP
статусы/JSON/redirect, срок/flags cookie, UI-ветвление и cleanup
клиентского Query состояния.
