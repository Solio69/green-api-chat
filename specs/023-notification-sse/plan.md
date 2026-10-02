# Implementation Plan: SSE доставка и Query обработка

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: Approved 2026-10-02, пользователь поручил техническую подготовку всех 018–025.
**Разрешение на реализацию**: CodeNotAuthorized. Сейчас только документы.

## Summary

Fetch streaming SSE с cookie/scope/capability headers; одна controller на Query scope независимо от выбранного чата. Она применяет shared facts/overlay, затем HTTP ACK; disconnect/recovery history count 10, safe lifecycle и явное ограничение второй вкладки, без редизайна.

## Considered Options

Сравнение вариантов/рисков и причины выбора: [research.md](research.md). Product choices заданы согласованной spec; plan не меняет ACK, one-tab, память или объём истории.

## Technical Context

TypeScript 5.9.3, Node 24.x/npm11.x, Next 16.3.7/React 19.3.0, Query 5.104.0, iron-session 9.0.1. Existing Playwright 1.63 integration/query configs; новых зависимостей/DB нет. Сервер — один постоянный Node process; credentials существующая encryptedHttpOnly cookie. Git/staging не изменяются. Runtime tests NotRun, текущие provider settings не проверены.

## Constitution Check

| Принцип | До / после проектирования | Основание                                                                                    |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| C1      | PASS / PASS               | Product choices согласованы; технические параметры отделены от гарантий API                  |
| C2      | PASS / PASS               | Самостоятельная feature и последовательный TDD; общие зависимости остаются отдельными шагами |
| C3      | PASS / PASS               | Spec Approved 2026-10-02; CodeNotAuthorized, документы не разрешают эффекты                  |
| C4      | PASS / PASS               | Git mutations не выполняются; пользовательский staging сохраняется                           |
| C5      | PASS / PASS               | Установок/изменений provider settings нет; операторские действия описаны                     |
| C6      | PASS / PASS               | Явный FeatureDirectory, только вымышленные fixtures, scope/owner изоляция                    |
| C7      | PASS / PASS               | Planned Red→Green→Refactor; acceptance NotRun, frozen analyze отдельный этап                 |
| C8      | PASS / PASS               | Без DB/Redis/broker/new deps/редизайна; bounded memory и existing tools                      |

## Research and Design

[Research](research.md), [data-model](data-model.md), [notification-http.md](contracts/notification-http.md), [sse-stream.md](contracts/sse-stream.md), [notification-client.md](contracts/notification-client.md), [quickstart](quickstart.md), [acceptance](checklists/acceptance.md). Все артефакты применимы; миграции/DBschema неприменимы, permanentstorage не согласован. Анализ будет отдельным read-only frozen проходом после согласования общих contracts; текущий plan не заменяет analysis.md.

## Project Structure

| Будущий путь                                                                | Действие/причина                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| src/app/api/notifications/claim/route.ts                                    | Node route к atomic registry022                                                                            |
| src/app/api/notifications/stream/route.ts                                   | Node dynamic SSE response/abort                                                                            |
| src/app/api/notifications/ack/route.ts                                      | Scoped active owner delivery ACK                                                                           |
| src/app/api/notifications/release/route.ts                                  | Scoped release без takeover                                                                                |
| src/lib/notifications/handle-notification-request.ts                        | Cookie/scope/origin/body guards/JSON errors                                                                |
| src/lib/notifications/create-notification-stream.ts                         | SSE encoding/sink/backpressure/heartbeat                                                                   |
| src/lib/notifications/parse-sse.ts                                          | Chunk-safe bounded UTF8 framing                                                                            |
| src/lib/notifications/create-notification-connection.ts                     | Fetch controller/ACK/reconnect/cleanup                                                                     |
| src/lib/notifications/apply-notification.ts                                 | Shared019 facts/overlay and024 statuses                                                                    |
| src/lib/notifications/refresh-notification-chats.ts                         | Коалесцировать GetChats invalidations1/сек                                                                 |
| src/lib/notifications/types.ts, constants.ts                                | Дополнить 022 HTTP/stream/client types/codes                                                               |
| src/lib/routes/constants.ts, src/lib/http/constants.ts                      | Route names, owner/contenttype headers                                                                     |
| src/lib/api/constants.ts                                                    | Safe ownership/receiver errors; не общий logout на все 409                                                 |
| src/components/NotificationProvider/index.ts                                | Экспорт provider и hook по существующему component pattern                                                 |
| src/components/NotificationProvider/NotificationProvider.tsx                | Один scoped controller и публичный hook                                                                    |
| src/components/ChatHistoryPanel/ChatHistoryPanel.tsx                        | Recoveryconsumer внутриSelectionProvider: optionalNotificationhook → currentuseChatHistory.refetch count10 |
| src/app/page.tsx                                                            | Wrapper under QueryProvider вокруг ChatWorkspace, сохранить SSR slots                                      |
| src/components/LogoutButton/LogoutButton.tsx                                | Добавить scoped owner headers к активному logout; UI сохранить                                             |
| src/lib/query/create-query-session.ts                                       | При необходимости resource hook018: один owner API, не дублировать                                         |
| tests/integration/notification-api.spec.ts                                  | HTTP isolation/auth/body/ownership                                                                         |
| tests/integration/notification-stream.spec.ts                               | Encoding/headers/abort/backpressure                                                                        |
| tests/integration/notification-client.spec.ts                               | Framing/reconnect/ACK/lateresponses                                                                        |
| tests/query/notification-sse.spec.ts                                        | Multi-tab/controller/historyrace/unknown chat                                                              |
| tests/fixtures/query-app/components/NotificationProbe/NotificationProbe.tsx | Test-only observable controller/cache states                                                               |
| tests/fixtures/query-app/lib/notification-fixture.ts                        | Test-only fake provider/clock/state для долгого SSE и multi-tab; реальные API невызываются                 |
| tests/fixtures/query-app/app/api/notifications/[action]/route.ts            | Test-only claim/stream/ack/release для browser fixture, productionauthguards проверяет integration набор   |
| tests/fixtures/query-app/app/api/notification-fixture/route.ts              | Test-only контролируемые события/disconnect/errors/counters для browser приёмки                            |
| tests/fixtures/query-app/app/page.tsx                                       | Fixture mounting новой probe без production UI styles                                                      |
| specs/023-notification-sse/verification.md                                  | После кода фактическая верификация                                                                         |

Все пути относительны корню проекта и относятся к будущей реализации. Код приложения и тестов сейчас не создаётся и не меняется; пользовательские изменения сохраняются. Shared paths 019/022/023/024 внедряются последовательно после соответствующего разрешения; повторный source файл в manifests означает интеграцию к существующему API, не перезапись чужой feature.

## Tasks and Dependencies

022 runtime/normalizer/owner approved и реализованный к моменту backend integration;018 Query public session/cleanup/error contract;019 shared message cache/session chat overlay;019 pure statuses по spec024;025 selection recovery subscription. Wrapper держит SSR slots,021 sender uses internal scoped owner headers. Shared source files меняются последовательными feature steps, parallel docs не разрешают parallel editing этих файлов.

[Tasks](tasks.md) задаёт последовательные Test/Red→Green→Refactor группы. Missing module/type/environment failure не считается Red: после минимального typechecked contract seam тест обязан падать по причине отсутствующего целевого поведения. Production business logic до этого не внедряется. Каждый шаг Green зависит от подтверждённого behavioral Red, результаты сохраняются в будущий verification.md. Existing test coverage перед pure refactor подтверждается baseline.

## Verification

Integration: `npm run test:integration -- tests/integration/notification-api.spec.ts tests/integration/notification-stream.spec.ts tests/integration/notification-client.spec.ts`. Browser, если указан в tasks: `npm run test:query -- tests/query/notification-sse.spec.ts`. После группы source changes: `npm run typecheck`, `npm run lint`, `npm run format:check`; production `npm run build` для route/runtime bundling. Stylelint только если при согласованной интеграции затронут SCSS, текущая задача styles не планирует.

BehavioralRed/Green и финальные проверки сейчас **NotRun**; их нельзя отмечать Passed за review документов. Acceptance cases перечислены в checklists/acceptance. Failed при нарушении ACK/isolation/identity/no-downgrade; Blocked при отсутствующей обязательной реализованной dependency/окружении, не обходить permission/разрешение кода. Реальный provider не используется в автотестах. Ручные операторские настройки не требуют API write от агента.

## Post-design Constitution Check

C1–C8 повторно PASS по таблице выше. Разногласий продуктового поведения нет; technical contracts синхронизированы по feature ownership. Отдельное implementation authorization остаётся необходимым, никакие отметки выполнения tasks не проставлены.

## Complexity Tracking

Сложность ограничена необходимыми ACK/owner guards, bounded in-memory state и race защитой. Отдельный websocket server, persistence, горизонтальное масштабирование и новый UI style исключены. Причины timeout/lease/merge и их практические границы изложены в research/contract.

Общий порядок реализации, без циклических импортов:025→018→019→022→023→020→021→024.022 реализует server status normalizer по spec024;019/018 shared cache/reducer/issues доступны 023/021 до UI status шага 024. Dependency на spec024 не означает runtime import из ещё не реализованной feature.
