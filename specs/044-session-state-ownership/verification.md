# Verification 044 — владение состоянием подключения

## Спецификация и анализ

Полный комплект spec/plan/research/data-model/contracts/quickstart/tasks/checklist подготовлен до реализации. Read-only анализ до реализации: 21 путь, SHA-256 `70b2f77bf441162c0a7bf14cb8039ac7b28cbec66b12dcdc4f764a421ec9f92a`, изменений и findings нет. Повторный проход: 23 файла, SHA-256 `cb4eca5f5250e288f388843de165a2cbbe795b56f8334408644da659685a50ff`, изменений и findings нет.

## Локальная проверка

- Baseline: targeted integration 33/33 и RTL provider lifecycle 8/8.
- Новый тест ownership: 2/2; generic QuerySession не содержит feature defaults, composition задаёт точные chat/memory policies, close освобождает cache. Первоначальное ожидание теста содержало неверный префикс `unread`; сверено с существующей константой и исправлено на `chat-unread` до финального прогона. Ошибки приложения по этому поводу не было.
- После реализации: targeted integration 33/33 и RTL lifecycle 8/8; Vitest 60/60; Playwright integration 366/366; Query 46/46; production E2E 110/110.
- `npm run typecheck` (app, tests, query), `npm run lint`, `npm run lint:styles`, `npm run format:check`, `git diff --check` — PASS.
- Client/server graph: 28 roots, 232 TS/TSX, forbidden server runtime reachable=false. Feature imports из `src/lib/query` отсутствуют; оставшихся вызовов `session.options()` нет.
- Ручное ревью: chat fetch/reconcile и сроки перенесены без изменения; memory defaults перенесены без изменения; жизненный цикл close, callback errors, StrictMode и scoped data покрыты существующими тестами. Новых зависимостей, сетевых контрактов и хранилища нет.

## CI

Кодовый SHA `711be680b3073d5c1a5628d764e293294da53410` запушен в `refactor`; обе [GitHub CI jobs](https://github.com/Solio69/green-api-chat/actions/runs/37142727661) завершились success, отчёты `quality-1` и `browser-1` сохранены. Итоговый документационный SHA проверяется отдельно после push.
