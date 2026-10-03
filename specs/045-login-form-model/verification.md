# Verification 045 — модель формы входа

## Спецификация и анализ

Технический комплект подготовлен до кода. Первичный read-only проход: 21 путь, SHA-256 `895ce8531574ca55ad2b76fc307251fd467f8f73d9fe23f2d2a341c669481a85`, unchanged=true; найдено F045-1 HIGH (новый auth/client и сохранение старого UI пути против карты 035). После отдельного исправления повторный проход: 21 путь, SHA-256 `3dca316d0d3c9ddf3f89a8b4d70fb063fb06d5eb843dd8ec5f1fbae5fb1ef580`, unchanged=true, findings 0. После реализации: 34 файла, SHA-256 `179d0026dffb220ae40ca3cbff3ba2c12de59b88cab140650854efb6b36c736b`, unchanged=true, findings 0.

## TDD и локальные проверки

- Baseline до кода: 39/39 production browser сценариев login/logout/prehydration/UI и 25/25 серверных integration auth/login.
- Behavioral Red: `npm run test:component -- tests/component/login-form.test.tsx` — 1 Failed. После unmount поздний HTTP success вызвал `router.replace('/')` вопреки ожиданию. Это целевой дефект, а не ошибка установки/импорта.
- Green: тот же компонентный тест 1/1 после добавления отмены/проверки жизненного цикла; новые unit/RTL сценарии адаптеров, валидации, duplicate submit, выхода и позднего ответа 10/10.
- После Refactor: Vitest 70/70; Playwright integration 366/366; Query 46/46; production E2E 110/110; целевые browser login/logout 39/39.
- `npm run typecheck` (app/tests/query), `npm run lint`, `npm run lint:styles`, `npm run format:check`, `git diff --check` — PASS.
- Client/server graph: 28 roots, 237 TS/TSX, server runtime reachable=false. В runtime/tests нет старых импортов четырёх auth компонентов; auth UI не импортирует auth/server, session runtime или `next/headers`.
- Предкоммитное ревью: точные DOM/ARIA, HTTP маршруты/тело, native form safety, CSS и внешний public entry сверены с baseline. Новых пакетов, глобального store, реальных реквизитов и изменений серверного контракта нет.

## CI

Кодовый SHA и итоговый документационный SHA проверяются после push; результаты будут добавлены в этот отчёт.
