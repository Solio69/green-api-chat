# Verification 047 — профиль аккаунта

## Спецификация и анализ

Полный комплект Spec Kit подготовлен до кода. Read-only анализ до реализации: 20 путей, исходный SHA-256 `67256e0d46a84829cb1f56332cf0c409b4d27476d9f96a56e571553e1a30364a`, найденный пробел test level исправлен отдельно; повторный SHA-256 `881cd936adbc321a449185c427fef2ec93f567c2649a89b98c58591ffdd16381`, unchanged=true, открытых findings 0. Post-analysis: 35 путей, SHA-256 `cd42db5af78023704a5bc4174bc598b0602c74405fe587a3b59e77e7534e54c1`, unchanged=true, findings 0.

## Регрессия и локальные проверки

- До переноса: 47/47 целевых integration `account-profile`, `get-account-settings`, `home-flow`; 11/11 production E2E `account-profile`.
- Новые `tests/unit/account-profile.test.ts`, `tests/component/account-avatar.test.tsx`, `account-header.test.tsx`: 6/6 на исходном коде и 6/6 после переноса. Первый запуск имел 1 ошибку самого теста: декоративный `img` с пустым alt имеет роль presentation; запрос исправлен на DOM `img`, повторный baseline зелёный. Это не поведенческий Red, поскольку контракт не менялся.
- После Refactor: Vitest 87/87; Playwright integration 366/366; Query 46/46; production E2E 110/110.
- `npm run typecheck` (app/tests/query), `npm run lint`, `npm run lint:styles`, `npm run format:check`, `git diff --check` — PASS. ESLint выявил только порядок импортов, Prettier — оформление перенесённых файлов; исправлено перед финальной проверкой.
- Client/server graph: 28 roots, 245 TS/TSX, server runtime reachable=false. Старых account/component импортов нет; `account/model` и `account/ui` не импортируют server runtime.
- Предкоммитное ревью: normalize-profile сохраняет fallback, HTTPS/credential filtering; provider adapter, retry, `resolveHome`, DOM/SCSS/темы и доступность не менялись. Новых пакетов, БД, хранилища, данных пользователя и provider-вызовов нет.

## CI

Кодовый SHA `d7a35c5525640f9177c1e6bff5c485270ebc526e` отправлен в `refactor`: обе [GitHub CI jobs](https://github.com/Solio69/green-api-chat/actions/runs/37148254333) успешны, artifacts `quality-1` и `browser-1` доступны. Итоговый документационный SHA проверяется после push.
