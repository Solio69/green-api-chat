# Verification 048 — модуль списка чатов

## Спецификация и анализ

Полный комплект подготовлен до кода. Read-only анализ до реализации: 49 путей, исходный SHA-256 `2b1a5fc3b57f25d65fca5603417d54473e8007bf4f194e7df92f8867c2fa4633`, три технических уточнения внесены отдельно; повторный SHA-256 `a5f409709baccf53f88c685f667a598aa1629e299805378d1d8eb4b81f83d7c8`, unchanged=true, findings 0. Post-analysis: 91 путь, SHA-256 `df86a6cac11bcdda9c84485b047588f85ca11b9fb2747a6d952408d4a994353a`, unchanged=true, findings 0.

## Регрессия и локальные проверки

- До переноса: целевые integration `chat-query/chats-api/session-chat-facts` 54/54; Query `chat-query/session-chat-overlay` 10/10; production E2E `chat-list-ui` 8/8.
- Новые `tests/unit/chat-list-model.test.ts` и `tests/component/chat-list.test.tsx`: 4/4 на исходном коде и 4/4 после переноса. Проверены pending/empty/list, единственность подтверждённого чата, сохранение локального label, выбранная строка, точное unread 120 при визуальном 99+ и открытие клавиатурой. Бизнес-логика/HTTP не менялись, искусственный Red не требовался.
- После Refactor: Vitest 91/91; Playwright integration 366/366; Query 46/46; production E2E 110/110.
- `npm run typecheck` (app/tests/query), `npm run lint`, `npm run lint:styles`, `npm run format:check`, `git diff --check` — PASS. Первые lint/format прогоны указали на импортный порядок и перенос строк; исправлено до итогового прохода.
- Client/server graph: 28 roots, 253 TS/TSX, server runtime reachable=false. Нет старых импортов chats/components; model/application/ui не импортируют server runtime, общий QueryProvider не импортирует chats.
- Предкоммитное ревью: provider order/normalization, query key, stale/gc/retry/refetch, overlay, manual retry, selection/unread и HTTP-контракты сохранены; UI и shared badge сохранили ARIA, keyboard и SCSS. Новых пакетов, БД, второго кеша, пользовательских данных и реальных provider-запросов нет. Публичный вход QueryProvider остаётся переходным до 049/054 без обратной зависимости от chats.

## CI

Кодовый SHA `5e301258ea4ab6a85ff974481a743e0ee6164dd7` запушен в `refactor`; [Quality run 37150666313](https://github.com/Solio69/green-api-chat/actions/runs/37150666313): `quality=success`, `browser=success`, артефакты `quality-1` и `browser-1` сохранены. Документационный SHA и его обе CI jobs фиксируются после отдельного push.
