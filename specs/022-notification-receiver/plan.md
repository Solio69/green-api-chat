# Implementation Plan: Серверный получатель уведомлений

**Действующая архитектура**: [027](../027-vercel-notification-polling/spec.md)
определяет HTTP polling/подписанный ACK и Web Locks в одном browser origin/scope.
Процессный registry, постоянный Node, SSE и общий серверный send lease не входят
в текущую реализацию. Функциональные правила сообщений/статусов сохраняются;
транспортные и процессные требования этого документа применяются по контракту027.
Актуальные проверки: [verification027](../027-vercel-notification-polling/verification.md).

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: Approved 2026-10-02, пользователь поручил техническую подготовку всех 018–025.
**Разрешение на реализацию**: CodeAuthorized.

## Summary

Один процессный reader/owner на idInstance, HTTP API Receive5 сек → одна validated delivery → HTTP ACK браузера → Delete. Capability/epoch/scope ограничивают право и Send020; пауза/expiry/disconnect прекращают новые операции. Нормализация не передаёт raw provider body.

## Considered Options

Сравнение вариантов/рисков и причины выбора: [research.md](research.md). Product choices заданы согласованной spec; plan не меняет ACK, one-tab, память или объём истории.

## Technical Context

TypeScript 5.9.3, Node 24.x/npm11.x, Next 16.3.7/React 19.3.0, Query 5.104.0, iron-session 9.0.1. Existing Playwright 1.63 integration/query configs; новых зависимостей/DB нет. Сервер — один постоянный Node process; credentials существующая encryptedHttpOnly cookie. Git/staging не изменяются. Runtime tests PassedSynthetic; реальные provider settings не проверены.

## Constitution Check

| Принцип | До / после проектирования | Основание                                                                                       |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| C1      | PASS / PASS               | Product choices согласованы; технические параметры отделены от гарантий API                     |
| C2      | PASS / PASS               | Самостоятельная feature и последовательный TDD; общие зависимости остаются отдельными шагами    |
| C3      | PASS / PASS               | Spec Approved 2026-10-02; CodeAuthorized, реальные настройки и отправку агент не выполняет      |
| C4      | PASS / PASS               | Git mutations не выполняются; пользовательский staging сохраняется                              |
| C5      | PASS / PASS               | Установок/изменений provider settings нет; операторские действия описаны                        |
| C6      | PASS / PASS               | Явный FeatureDirectory, только вымышленные fixtures, scope/owner изоляция                       |
| C7      | PASS / PASS               | Фактический Red→Green→Refactor; acceptance PassedSynthetic; итоговый analyze отдельным проходом |
| C8      | PASS / PASS               | Без DB/Redis/broker/new deps/редизайна; bounded memory и existing tools                         |

## Research and Design

[Research](research.md), [data-model](data-model.md), [receiver-runtime.md](contracts/receiver-runtime.md), [notification-normalization.md](contracts/notification-normalization.md), [quickstart](quickstart.md), [acceptance](checklists/acceptance.md). Все артефакты применимы; миграции/DBschema неприменимы, permanentstorage не согласован. Анализ будет отдельным read-only frozen проходом после согласования общих contracts; текущий plan не заменяет analysis.md.

## Project Structure

| Путь                                              | Действие/причина                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| src/lib/notifications/receiver-registry.ts        | Новый registry, lifecycle/guards/Send semaphore                                                   |
| src/lib/notifications/receiver-loop.ts            | Последовательная очередь, ACK/Delete/recovery/backoff                                             |
| src/lib/notifications/types.ts                    | Общие safe runtime/delivery types; дополнит 023                                                   |
| src/lib/notifications/constants.ts                | Receiver timeouts/grace/backoff/limits/codes; дополнит 023                                        |
| src/lib/notifications/normalize-notification.ts   | Envelope/incoming/ignored validation                                                              |
| src/lib/notifications/normalize-message-status.ts | Server status DTO по spec024, shared types019                                                     |
| src/lib/green-api/get-notification-settings.ts    | Read-only GetSettings preflight один раз на epoch                                                 |
| src/lib/green-api/receive-notification.ts         | Server-only provider fetch5/8 сек                                                                 |
| src/lib/green-api/delete-notification.ts          | Server-only checked receipt DELETE/result                                                         |
| src/lib/http/constants.ts                         | Добавить DELETE method, без изменения старых статусов/timeout                                     |
| src/lib/green-api/constants.ts                    | Добавить method names, не заменить GetChats constants                                             |
| src/app/api/auth/logout/route.ts                  | Async cookie+scope+capability revoke до удаления cookie; inactive без cap не отзывает чужой owner |

| tests/integration/notification-owner.spec.ts | Guard/lifecycle/inflight/expiry tests |
| tests/integration/notification-receiver.spec.ts | Fake FIFO/ACK/false/timeout/paused tests |
| tests/integration/notification-normalization.spec.ts | Incoming/text/unsupported/ignored/malformed tests |
| specs/022-notification-receiver/verification.md | Создать после кода, фактические команды/Red/Green/review |

Все пути относительны корню проекта; ниже итоговый manifest реализации. Реализация выполняется в авторизованном объёме; пользовательские изменения сохраняются. Shared paths 019/022/023/024 внедряются последовательно после соответствующего разрешения; повторный source файл в manifests означает интеграцию к существующему API, не перезапись чужой feature.

## Tasks and Dependencies

018 QuerySession/public auth errors и existing cookie; Normalized cache019 и status enum024 — согласованные DTO; server status normalizer реализует 022.022 pure runtime допустимо проверить с typed fake sink до 023; browser end-to-end acceptance022 завершена после023: PassedSynthetic.020/021 consumes tryAcquireSend, не создаёт owner альтернативно.023 routes интегрируют этот runtime после своего разрешения;025 selection не влияет на reader.

[Tasks](tasks.md) задаёт последовательные Test/Red→Green→Refactor группы. Missing module/type/environment failure не считается Red: после минимального typechecked contract seam тест обязан падать по причине отсутствующего целевого поведения. Production business logic до этого не внедряется. Каждый шаг Green зависит от подтверждённого behavioral Red, результаты сохраняются в будущий verification.md. Existing test coverage перед pure refactor подтверждается baseline.

## Verification

Integration: `npm run test:integration -- tests/integration/notification-owner.spec.ts tests/integration/notification-receiver.spec.ts tests/integration/notification-normalization.spec.ts`. Browser, если указан в tasks: `npm run test:query -- tests/query/message-composer.spec.ts`. После группы source changes: `npm run typecheck`, `npm run lint`, `npm run format:check`; production `npm run build` для route/runtime bundling. Stylelint только если при согласованной интеграции затронут SCSS, текущая задача styles не планирует.

BehavioralRed/Green и финальные проверки **PassedSynthetic**; доказательства в verification.md, review документов не подменяет тесты. Acceptance cases перечислены в checklists/acceptance. Failed при нарушении ACK/isolation/identity/no-downgrade; Blocked при отсутствующей обязательной реализованной dependency/окружении, не обходить permission/разрешение кода. Реальный provider не используется в автотестах. Ручные операторские настройки не требуют API write от агента.

## Post-design Constitution Check

C1–C8 повторно PASS по таблице выше. Разногласий продуктового поведения нет; technical contracts синхронизированы по feature ownership. Implementation authorization получено2026-10-02; задачи завершены по фактическим проверкам, реальные операторские действия NotRun.

## Complexity Tracking

Сложность ограничена необходимыми ACK/owner guards, bounded in-memory state и race защитой. Отдельный websocket server, persistence, горизонтальное масштабирование и новый UI style исключены. Причины timeout/lease/merge и их практические границы изложены в research/contract.

Общий порядок реализации, без циклических импортов:025→018→019→020 core→022→023→020 HTTP→021→024.022 реализует server status normalizer по spec024;019/018 shared cache/reducer/issues доступны 023/021 до UI status шага 024. Dependency на spec024 не означает runtime import из ещё не реализованной feature.

## Результат реализации 2026-10-02

**Implementation Authorization**: CodeAuthorized. Прямое поручение пользователя:
«делай все эти задачи до 24 включительно. Интерфейс должен быть выполнен в
соответствии с макетом. Перед написанием кода прочитай правила написания кода
и код-стайл». Правила прочитаны до кода; согласованные продуктовые решения сохранены.
**Verification**: PassedSynthetic — автоматические серверные, React и production
проверки с фиктивным GREEN-API. Реальная операторская проверка: NotRun.
Полные доказательства, фактический TDD и ограничения: [verification](verification.md).
Итоговая согласованность: [analysis](analysis.md). Разрешение не включает удалённые
настройки, настоящие сообщения, установку пакетов или Git mutations.

## Фактическое дополнение manifest

- src/lib/notifications/server-registry.ts — versioned Symbol/global registry,
  общий для production route bundles; HMR invalidation/drain перед заменой.
- tests/integration/notification-provider.spec.ts, notification-delete-recovery.spec.ts,
  notification-health.spec.ts, notification-errors.spec.ts, notification-hmr.spec.ts —
  provider/privacy/settings, ambiguous Delete/Retry-After, retrying/receiving и drain.
- tests/notifications/constants.ts — независимые ожидаемые значения и fictional data.

Hot dispose проверен injected runtime тестом; поддержка hosting/HMR конкретной
площадки не является обещанием multi-process. В production один Node process.
