# Implementation Plan: Статусы доставлено/прочитано/отказ

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: Approved 2026-10-02, пользователь поручил техническую подготовку всех 018–025.
**Разрешение на реализацию**: CodeAuthorized.

## Summary

Нормализовать Telegram outgoingMessageStatus; чистое status merge019 со strict identity и bounded early facts, failure без id→general issue, конфликт success/failure без downgrade. Отразить static labels в существующем UI, без редизайна/remote settings writes.

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

[Research](research.md), [data-model](data-model.md), [message-statuses.md](contracts/message-statuses.md), [quickstart](quickstart.md), [acceptance](checklists/acceptance.md). Все артефакты применимы; миграции/DBschema неприменимы, permanentstorage не согласован. Анализ будет отдельным read-only frozen проходом после согласования общих contracts; текущий plan не заменяет analysis.md.

## Project Structure

| Путь                                                                                                                                             | Действие/причина                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| src/lib/notifications/normalize-message-status.ts                                                                                                | Существующий 022 server normalizer, уточнять лишь после подтверждённого нового Red |
| src/lib/messages/merge-message-facts.ts                                                                                                          | Существующий 019 reducer: сверить baseline и full permutations, без дублирования   |
| src/lib/messages/message-status-issues.ts                                                                                                        | Существующий 019 pure publication helper; читать latest issues для UI              |
| src/lib/messages/message-cache.ts                                                                                                                | Общий 019 cache использует reducer/early facts; не новый store                     |
| src/lib/notifications/normalize-notification.ts                                                                                                  | Подключить status normalizer022, unknown valid ignored                             |
| src/lib/notifications/apply-notification.ts                                                                                                      | Delivery→shared facts/issue; successful processing ACK023                          |
| src/components/MessageBubble/MessageBubble.tsx, src/components/ChatHistoryPanel/ChatHistoryPanel.tsx, src/components/MessageList/MessageList.tsx | Existing message status/error outlet без layout изменения                          |
| src/components/MessageStatusIndicator/MessageStatusIndicator.tsx, index.ts, constants.ts                                                         | Новый status presenter, используемый optional slot MessageBubble                   |
| src/components/MessageStatusIssue/MessageStatusIssue.tsx, index.ts, constants.ts                                                                 | Scoped latest general issue presenter для существующего error outlet               |
| tests/integration/message-statuses.spec.ts                                                                                                       | Enum/identity/permutations/TTL/size/conflict tests                                 |
| tests/query/message-composer.spec.ts                                                                                                             | Видимые labels/general issue/early fact/no bubble                                  |
| tests/fixtures/query-app/components/MessagingProbe/MessagingProbe.tsx                                                                            | Дополнить status issue observability test fixture                                  |
| specs/024-message-statuses/verification.md                                                                                                       | После implementation actual Red/Green/results                                      |

Все пути относительны корню проекта; ниже итоговый manifest реализации. Реализация выполняется в авторизованном объёме; пользовательские изменения сохраняются. Shared paths 019/022/023/024 внедряются последовательно после соответствующего разрешения; повторный source файл в manifests означает интеграцию к существующему API, не перезапись чужой feature.

## Tasks and Dependencies

019 normalized model/cache/early facts source of truth;022 validates envelope,022 validates status по spec024,023 consumes safe DTO,020/021 acceptance separate. MessageBubble/ChatHistoryPanel созданы 019;024 использует их status/error slots, сохраняет макет/styles, не создаёт новую страницу. Required toggles пользователь включает вручную.

[Tasks](tasks.md) задаёт последовательные Test/Red→Green→Refactor группы. Missing module/type/environment failure не считается Red: после минимального typechecked contract seam тест обязан падать по причине отсутствующего целевого поведения. Production business logic до этого не внедряется. Каждый шаг Green зависит от подтверждённого behavioral Red, результаты сохраняются в будущий verification.md. Existing test coverage перед pure refactor подтверждается baseline.

## Verification

Integration: `npm run test:integration -- tests/integration/message-statuses.spec.ts`. Browser, если указан в tasks: `npm run test:query -- tests/query/message-composer.spec.ts`. После группы source changes: `npm run typecheck`, `npm run lint`, `npm run format:check`; production `npm run build` для route/runtime bundling. Stylelint только если при согласованной интеграции затронут SCSS, текущая задача styles не планирует.

BehavioralRed/Green и финальные проверки **PassedSynthetic**; доказательства в verification.md, review документов не подменяет тесты. Acceptance cases перечислены в checklists/acceptance. Failed при нарушении ACK/isolation/identity/no-downgrade; Blocked при отсутствующей обязательной реализованной dependency/окружении, не обходить permission/разрешение кода. Реальный provider не используется в автотестах. Ручные операторские настройки не требуют API write от агента.

## Post-design Constitution Check

C1–C8 повторно PASS по таблице выше. Разногласий продуктового поведения нет; technical contracts синхронизированы по feature ownership. Implementation authorization получено2026-10-02; задачи завершены по фактическим проверкам, реальные операторские действия NotRun.

## Complexity Tracking

Сложность ограничена необходимыми ACK/owner guards, bounded in-memory state и race защитой. Отдельный websocket server, persistence, горизонтальное масштабирование и новый UI style исключены. Причины timeout/lease/merge и их практические границы изложены в research/contract.

Общий порядок реализации, без циклических импортов:025→018→019→020 core→022→023→020 HTTP→021→024.022 реализует server status normalizer по spec024;019/018 shared cache/reducer/issues доступны 023/021 до UI status шага 024. Dependency на spec024 не означает runtime import из ещё не реализованной feature.

Core reducer/normalizer уже существуют в 018/019/022: подтвердить baseline перед их чистым рефакторингом. Новая логика presenter/outlet024 проходит собственный behavioral Red→Green→Refactor. Если расширенная contract assertion выявила реальный недостающий core behavior, её Red предшествует точечному исправлению; ранее зелёный контракт не ломать искусственно.

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
