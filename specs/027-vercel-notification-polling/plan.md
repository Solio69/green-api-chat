# Implementation Plan: Vercel notification polling

**Дата**: 2026-10-03. **Spec**: [spec.md](spec.md). Согласование и разрешение на весь описанный переход сохранены из текущей переписки; повторный gate не нужен.

## Summary / Options

Выбран последовательный receive→apply→ACK цикл. SSE+Redis сохраняет глобальную координацию, но требует несогласованной внешней инфраструктуры; постоянный Node hosting нарушает фиксированную площадку Vercel. Stateless handlers и Web Locks отвечают утверждённому упрощению. Не добавляем зависимости: HMAC SHA-256 из node:crypto, Web Locks и AbortController браузера.

## Design

POST settings {} проверяет GetSettings; POST receive {ownerEpoch} получает одну голову и выдаёт {delivery,ackToken}; POST ack {ackToken} проверяет HMAC scope/receipt/expiry и выполняет delete. При false получаем голову для восстановления потерянного ACK: тот же receipt => временная ошибка, другой/null => success. Server deadlines 8 s; maxDuration 20 s оставляет запас для delete+проверка головы. Client deadline 25 s; межзапросная пауза 100 ms ограничивает частоту, backoff 1/2/4/8/10 s. Максимальную допустимую частоту определяет GREEN-API, при отказах применяем Retry-After/backoff.

Proof — base64url(JSON payload).base64url(HMAC), purpose отделяет домен, payload не содержит событий/реквизитов. Срок min(now+300 s, session expiresAt), явная проверка собственного expiry без tolerance. Ограничения длины/body сохраняются. ownerEpoch — только локальная эпоха попытки, не серверное право; сервер echo для защиты от поздних ответов.

Browser lease удерживается независимо от receive/backoff/pause, освобождается при окончательном close; retry не создаёт параллельный цикл. Epoch сохраняется при временном восстановлении, чтобы late send оставался привязанным к исходному контексту; смена подключения/close его инвалидирует. Lock key содержит scope. Не использовать localStorage, BroadcastChannel, shared Node maps или server timers.

## Technical Context / C1–C8

Node 24, Next App Router, existing npm/Playwright; production/proxy-cookie safeguards сохраняются. C1 PASS — схема обсуждена; C2 PASS — одна migration feature; C3 PASS — явная авторизация specs→code→review; C4 PASS — Git read-only; C5 PASS — no installs/data migrations; C6 PASS — явный FEATURE_DIR, fake credentials; C7 PASS — Red до кода, hash-verified analysis; C8 PASS — без новых инфраструктуры/UI, отдельные небольшие модули по роли. После проектирования те же результаты.

## Artifacts

[research.md](research.md), [data-model.md](data-model.md), [HTTP contract](contracts/notification-http.md), [client contract](contracts/notification-client.md), [quickstart.md](quickstart.md), [tasks.md](tasks.md), [acceptance.md](acceptance.md), [verification.md](verification.md). Данные и протокол применимы; schema DB/migrations неприменимы.

## Project Structure

- Новые src/lib/notifications/ack-proof.ts, receiver-error.ts, browser-tab-lease.ts, notification-transport.ts, handle-notification-route.ts; constants/types/handle-notification-request/create-notification-connection/request-context обновляются.
- Новые src/app/api/notifications/settings/route.ts и receive/route.ts; ack route меняется; claim/stream/release routes удаляются.
- Удалить src/lib/notifications/server-registry.ts, receiver-registry.ts, receiver-loop.ts, create-notification-stream.ts, parse-sse.ts после миграции их потребителей; error выделить без runtime.
- src/lib/green-api/{notification-request,get-notification-settings,delete-notification}.ts обновить imports error.
- src/lib/sending/{types,handle-send-request,fetch-send-message,create-send-controller}.ts, src/app/api/messages/route.ts, src/app/api/auth/logout/route.ts — убрать server ownership/lease; клиентские protection и исходы сохраняются.
- src/components/NotificationNotice/{constants,NotificationNotice}.tsx/ts — только copy отсутствующего Web Locks, без redesign.
- tests/integration/vercel-notifications.spec.ts и polling-connection.spec.ts; прежние notification-api/client/connection/delete-recovery/errors/health/hmr/lifecycle/owner/receiver/retry/safety tests заменяются актуальными контрактными сценариями, не сохранять мёртвую реализацию ради тестов. provider/normalization/cache/unread/status tests сохраняются; provider imports error обновить.
- tests/integration/send-message.spec.ts, message-send-controller.spec.ts адаптировать без server leases; validation/guards/outcomes сохраняются.
- tests/fixtures/query-app/{lib/notification-fixture.ts,app/api/notifications/[action]/route.ts,app/api/messages/route.ts} — fake provider вместо registry.
- tests/query/message-composer.spec.ts и новые polling-workspace.spec.ts — browser lease/close/reload; unread tests сохраняются.
- tests/e2e/owner-fixture.ts — больше не нужны server claims cleanup.
- README.md сохранить пользовательскую структуру, исправить только текущую архитектуру/размещение; docs/{project-overview,messaging-specs,messaging-readiness,chat-ui-spec}.md и specs/022-notification-receiver/{spec,plan,contracts/receiver-runtime}.md, specs/023-notification-sse/{spec,plan,contracts/notification-http,contracts/notification-client}.md, specs/024-message-statuses/spec.md — актуальный указатель к 027 и границы Vercel.

## Execution / Verification

T001 behavioral Red по существующему handler с независимым registry (ожидаем поддержку receive, не import error) → T002 stateless endpoints/proof/send → T003 client loop/lease → T004 fixture/test migration → Green → T005 reread rules + review/refactor → T006 docs + regression и final read-only analysis. Команды npm run test:integration, test:query, test:e2e последовательно; lint/styles/format/types и build через E2E. Реальные API/секреты/Vercel/account billing не трогаем. Полный состав удаления tests уточняется по references и отражается verification; новая suite покрывает смысл каждого актуального требования.

## Complexity

HMAC нужен для проверяемого ACK между экземплярами. Web Lock нужен для предотвращения двух читателей в одном браузере. Внешняя координация и exactly-once исключены явно. Временные Node state fixtures только в тестовом стенде, не deployment runtime.

Обновить также specs/018-chat-history-console/architecture-notes.md: текущая архитектура Vercel/HTTP/ACK вместо постоянного процесса. Проверки старых feature не переписывать как новые результаты.
