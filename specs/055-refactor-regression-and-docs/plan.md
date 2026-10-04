# Implementation Plan: итоговая регрессия и документация 055

**Feature**: [spec](spec.md) · **Branch**: `refactor` · **Date**: 2026-10-04 · **Work type**: проверка и документация без изменения бизнес-логики.

## Цель и видимый результат

На одном итоговом состоянии проекта подтверждены typecheck всех трёх конфигураций, линтеры, формат, Vitest, Query browser и production E2E/сборка; после push успешный CI привязан к точному SHA. README и текущие правила описывают фактические модули, команды и уровни тестов. Восемь гарантий 028 сопоставлены с сохранившимися сценариями и их текущими файлами. Ограничения, не проверяемые автоматикой (реальный провайдер и деплой), названы отдельно.

## Контекст и технические границы

Next.js 16.3.7, React 19.3, TypeScript 5.9.3, TanStack Query 5.104, iron-session 9.0.1, SCSS Modules; Vitest/RTL и Playwright уже установлены. `npm run typecheck` охватывает app, Vitest и Query fixture; `npm test` — Node/DOM; `npm run test:query` — отдельный Next стенд и Chromium; `npm run test:e2e` — production Next build и Chromium. Browser suites запускаются последовательно. `npm run build` отдельно нужен только если production E2E не смогла выполнить сборку. Локальный прогон и GitHub run показывают разные утверждения: последний проверяется только по `head_sha`, двум jobs и артефактам.

## Файлы и порядок

1. Уточнить status/authorization в существующих `spec.md` и `checklists/requirements.md` без изменения требований. Сверить `README.md`, `docs/CODE_STYLE.md`, `docs/CODING_RULES.md`, `docs/architecture.md`, `docs/project-overview.md`, `docs/refactoring-roadmap.md`, `package.json`, `tests`, `specs/028`, `051`–`054`; записать [inventory](inventory.md).
2. Подготовить этот `plan.md`, [research](research.md), [data model](data-model.md), [contract](contracts/final-readiness.md), [quickstart](quickstart.md), `tasks.md`; провести отдельный read-only analyze, записать `analysis.md` после прохода.
3. Адресно исправить текущие документы: прежде всего README (архитектура/public entries, уровни Vitest/RTL/Playwright, фиктивное окружение, команды и CI), `docs/CODE_STYLE.md` (старый alias), `docs/project-overview.md` (различие исторического статуса и актуального refactor), `docs/refactoring-roadmap.md` (готовность R10). `docs/architecture.md` и `docs/CODING_RULES.md` трогать только при выявленном расхождении. Исторические specs/CSV не переписывать.
4. Составить `coverage-reconciliation.md` для G01–G08 исходной 028, используя точные B028 ID из карт 051–053 и проверку текущих файлов/названий сценариев. Указать границу доказательства для реального GREEN-API и deployment.
5. Проверить локальные Markdown-ссылки и команды, затем один полный финальный прогон на этом состоянии: `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, последовательно `npm run test:query` и `npm run test:e2e`. Не перезапускать уже прошедшее без изменения затронутого кода/документов или новой ошибки. Прогон не использует реальные реквизиты.
6. Провести read-only post-analysis, review точного diff/секретов/временных файлов, `git diff --cached --check` и список точных staged путей. Commit/push только `refactor` по уже данному исключению. Проверить GitHub Actions `head_sha`, `quality`, `browser`, артефакты; итог записать в `verification.md`. Если CI проверяет другую ревизию или падает, не объявлять завершение.

## Решения и ограничения

Документация обновляется адресно: масштабное переписывание исторических требований ухудшило бы прослеживаемость. Не добавляются пакеты, скрипты в package.json, новая инфраструктура, product behavior, реальные запросы GREEN-API и deployment. Чисто документационная задача не требует искусственного TDD Red; достоверность обеспечивается сверкой с исполняемыми scripts/кодом, локальной проверкой ссылок и полным регрессионным прогоном. Если обнаружится дефект поведения, зарегистрировать влияние и вынести на обсуждение, а не исправлять вне объёма.

## Конституция C1–C8

C1/C2/C3: задача и разрешение уже согласованы в переписке, объём ограничен финальной регрессией. C4: точное staging, commit/push только `refactor`; исключение не расширяет другие Git-действия. C5/C6: без установки и реальных данных. C7: read-only analyze отдельно от записи, статусы проверок и exact SHA, full suite после изменений. C8: адресная документация, без новой абстракции или инструмента. Повторная сверка после технической подготовки обязательна.
