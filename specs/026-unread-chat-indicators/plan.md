# Implementation Plan: Счётчики новых сообщений

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-03
**Согласование spec.md / Разрешение реализации**: прямое разрешение всего цикла в переписке, без повторного gate.

## Summary

Query memory cache unread IDs с дедупликацией; incoming apply обновляет его до ACK. Hook видимости использует существующий paneRef, ResizeObserver и Page Visibility. Отдельный badge используется строкой чата и мобильной кнопкой.

## Considered Options / Research and Design

[research.md](research.md), [data-model.md](data-model.md), [contracts/unread-indicators.md](contracts/unread-indicators.md), [quickstart.md](quickstart.md). Серверный HTTP контракт неприменим: сервер не меняется.

## Technical Context

Установленные Next 16.3.7, React 19.3.0, Query 5.104.0, TypeScript, SCSS Modules, Playwright. Один активный workspace, существующие connectionScope и session.close. Только память текущего подключения; Git и реальные данные не меняются.

## Constitution Check / Post-design Constitution Check

| Принцип | До/после | Основание |
| --- | --- | --- |
| C1 | PASS / PASS | Русский язык, count и фоновое поведение согласованы |
| C2 | PASS / PASS | Одна feature 026: индикаторы, без изменения получения/отправки |
| C3 | PASS / PASS | Пользователь прямо разрешил specs → code → review |
| C4 | PASS / PASS | Git только read-only |
| C5 | PASS / PASS | Нет установок и БД |
| C6 | PASS / PASS | Явный каталог, фиктивные данные |
| C7 | PASS / PASS | Red перед кодом, read-only analyze, фактический verification |
| C8 | PASS / PASS | Существующие Query/observer, небольшие компоненты, code style |

## Project Structure

Новые: src/lib/unread/constants.ts, unread-cache.ts, use-unread-counts.ts, use-conversation-read-state.ts; src/components/ChatUnreadBadge/{ChatUnreadBadge.tsx,ChatUnreadBadge.module.scss,constants.ts,index.ts}; tests/unread/constants.ts; tests/integration/unread-notifications.spec.ts; tests/query/unread-indicators.spec.ts; tests/fixtures/query-app/components/UnreadProbe/{UnreadProbe.tsx,index.ts}.

Изменяемые: tests/constants.ts (общая textbox role); src/lib/query/create-query-session.ts (memory defaults); src/lib/notifications/apply-notification.ts (incoming); src/components/ChatWorkspace/ChatWorkspace.tsx (hook); ChatListPanel/ChatListPanel.tsx (counts); ChatList/ChatList.tsx (prop); ChatListItem/ChatListItem.tsx и .module.scss (badge и flex label); ConversationHeader/ConversationHeader.tsx и .module.scss (total и мобильные промежутки); ConversationBackButton/ConversationBackButton.tsx и .module.scss (compact badge и gap); src/styles/_tokens.scss (badge размеры), src/styles/_mixins.scss (общий truncate-line для списка и мобильной шапки); tests/fixtures/query-app/app/page.tsx (probe); tests/fixtures/query-app/lib/notification-fixture.ts (explicit incoming id для повторов); docs/project-overview.md (026). Этот каталог: spec, requirements, plan, research, model, contract, quickstart, tasks, acceptance, analysis, verification.

## Tasks and Dependencies

T001 tests/integration/unread-notifications.spec.ts: существующий applyNotification должен создать unread, первоначальный Red — данных нет. T002 cache/defaults/apply после подтверждённого Red. T003 hook видимости. T004 badge/пропсы/токены. T005 browser fixture/tests. T006 Green/Refactor, весь набор проверок и preview. T007 актуализация docs/tasks/verification и итоговый read-only analyze.

## Verification

npm run test:integration -- unread-notifications.spec.ts для Red; после всей реализации npm run test:integration и npm run test:query. npm run lint, npm run lint:styles, npm run format:check, npm run typecheck; npm run build и npm run test:e2e. Браузерные скриншоты светлой/тёмной темы и mobile; проверка ограниченной высоты и отсутствия overflow. Ошибка импорта/окружения не считается Red. Результаты проверок и ограничения записаны в [verification.md](verification.md). Реальный аккаунт и реальное внимание пользователя — не автоматическая приёмка.

## Complexity Tracking

Seen IDs нужны, чтобы повтор после очистки не выглядел новым. Unread IDs нужны для уникальности; count вычисляется. Одна сессионная запись без новых провайдеров и зависимостей. Hook изолирует DOM и cleanup от раскладки.
