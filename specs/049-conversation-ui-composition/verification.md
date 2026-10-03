# Verification 049 — композиция UI переписки

## Спецификация и исходное покрытие

Полный технический комплект и read-only анализ завершены до кода: первый проход 97 путей, SHA-256 `3375353c8056e26e899b80328a6f3c01a4bf20082698b2d3db9f9cb06b5e9f4a`, найдено 1 HIGH/1 MEDIUM/1 LOW; технический план исправлен отдельно, повторный проход 98 путей, SHA-256 `dd790541fb4b74d4a643a13a830707b9dff3a7a682db07c90c18ad03b47ef7ae`, unchanged=true, 0 findings. Подробности — [analysis.md](analysis.md).

До переноса: Vitest unit/component 11/11; integration 24/24; Query 27/27; production E2E 27/27. Новые `tests/component/chat-history-panel.test.tsx` 2/2 прошли на исходном коде, затем 2/2 после переноса. Тесты проверяют состояния loading/empty/error с известными сообщениями, recovery refetch только выбранного чата и отписку. Чистый refactor не требует искусственного Red.

## Код и локальная проверка

- 71 файл UI по карте 049, семь provider файлов после логических 041/043, selection model (3) и history model (2) перемещены в целевые области. Добавлены отдельные public entries, структурный credential type и локальные model constants. Значения и нормализация не изменены.
- `ChatWorkspace` принимает готовый sidebar node; `app/page` собирает `ChatSidebar`. `ConversationChatListPanel` передаёт selection/unread через props в chats UI: обратной связи `chats/ui → conversation/ui` нет. `ChatHistoryPanel` передаёт подписку/состояние своему hook, JSX сохраняет прежние состояния и разметку.
- После связанных правок: `npm run typecheck` (app/tests/query) PASS, `npm run lint` PASS, `npm run lint:styles` PASS, `npm run format:check` PASS, `npm run test` 93/93, `npm run test:integration` 366/366, `npm run test:query` 46/46, `npm run test:e2e` 110/110; `git diff --check` PASS.
- Первые диагностические прогоны выявили относительные SCSS пути, import order, один относительный history import и TypeScript narrowing; исправлено до итогового набора. Production build подтверждён E2E.
- Старых импортов перенесённых `@/components/{ChatHistory,ChatWorkspace,Conversation,Message,Notification}` и трёх selection/двух history `lib` путей нет; `chats/ui` не импортирует conversation; client/server graph: 30 roots, 261 TS/TSX, server runtime reachable=false. Переходный QueryProvider и иные `lib` UI hooks остаются предметом архитектурного завершения 054, без нового цикла в этом переносе.

## Предкоммитное ревью и CI

Проверены состав собственных файлов, SCSS/ARIA/focus/scroll, отсутствие реальных секретов, карта 035 и повторный read-only анализ (131 путь, SHA-256 `67b52007e63fb0e976b10a825e3ac0beb2ecba7d8c83e225974e66b8ff813e20`, unchanged=true). Кодовый SHA и обе GitHub CI jobs фиксируются после push. Новых зависимостей, БД, реальных запросов provider и изменения send/unknown/ACK нет.
