# Verification 046 — модуль поиска получателя

## Спецификация и анализ

Полный комплект подготовлен до кода. Read-only анализ до реализации: 22 пути, SHA-256 1db2941bac1bc7cfad431809e0ac8574bd95fbf9bf73862547d3387eab2edcc1, unchanged=true, findings 0. Повторный анализ: 48 файлов, SHA-256 e4921cdafcf4444e76bc227db538811064ff9cbb819a682052794db88bd7dbaa, unchanged=true, findings 0. По фактическим зависимостям resolve-search назначен в server, чистый format-recipient-label — в model; две строки карты 035 исправлены.

## TDD и локальная проверка

- Baseline до кода: tests/integration/recipient-search.spec.ts 7/7, целевые production browser 10/10.
- Behavioral Red 1: тест размонтирования 1 Failed — у исходного fetch отсутствовал AbortSignal; после реализации Green 1/1.
- Behavioral Red 2: тест закрытия QuerySession 1 Failed — сигнал существовал, но закрытие сессии не отменяло его; после регистрации cleanup Green 4/4 RTL формы.
- После Refactor: Vitest 81/81; Playwright integration 366/366; Query 46/46; production E2E 110/110; целевые browser recipients 10/10.
- npm run typecheck (app/tests/query), npm run lint, npm run lint:styles, npm run format:check, git diff --check — PASS.
- Client/server graph: 28 roots, 242 TS/TSX, server runtime reachable=false. Нет старых runtime/test импортов lib/recipients и components/RecipientSearch*; model/ui не импортируют server runtime.
- Предкоммитное ревью: два режима, parser/label, found/not-found/ошибки/401, pending/retry, выбор без отправки, HTML/ARIA и SCSS сверены с baseline; новых зависимостей, store, серверного контракта и реальных реквизитов нет.

## CI

Кодовый SHA и итоговый документационный SHA проверяются после push.
