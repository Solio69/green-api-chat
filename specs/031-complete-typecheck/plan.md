# Implementation Plan: Общий typecheck

Spec: [spec.md](spec.md). Дата: 2026-10-03.
Авторизация: пользователь поручил полный цикл 031–055, commit и push в refactor.

## Summary и варианты

Объединить три существующие TS-программы последовательными npm scripts.
Варианты и причины: [research.md](research.md).
Текущие TypeScript 5.9, Next 16.3, Node 24; пакеты не меняются.
Данные и поведение приложения не меняются.

## Конституция до и после проектирования

C1 PASS: решение объяснено; C2 PASS: одна конфигурационная задача;
C3 PASS: комплект → read-only анализ → код, авторизация имеется;
C4 PASS: явное разрешение commit/push; C5 PASS: нет установки/БД;
C6 PASS: явный feature, фиктивные контрольные ошибки;
C7 PASS: положительные/отрицательные проверки реальной команды;
C8 PASS: используется существующий TypeScript, без дополнительного runner.

## Модель и контракт

[data-model.md](data-model.md), [contracts/typecheck.md](contracts/typecheck.md),
[quickstart.md](quickstart.md).
Общий typecheck последовательно вызывает typecheck:app, typecheck:tests,
typecheck:query через &&. Сбой останавливает цепочку с ненулевым кодом.
Два Next-приложения сначала генерируют собственные route types.
Strict и проверка исходников сохраняются.

## Файлы

- package.json: общая команда и typecheck:app/typecheck:query.
- tsconfig.json: полная root область tests с явными исключениями других проектов и ambient node.
- tsconfig.vitest.json: последовательные TS/TSX globs unit/component/setup/support.
- tests/fixtures/query-app/tsconfig.json: TS/TSX app/components и dev route types.
- README.md: общая команда и состав областей.
- docs/refactoring-roadmap.md: статус 031.
- specs/031-complete-typecheck/spec.md, checklists/requirements.md: авторизация/приёмка.
- В том же feature: research.md, plan.md, data-model.md, contracts/typecheck.md,
  quickstart.md, tasks.md, analysis.md, verification.md.

Lockfile, зависимости и src не изменяются. Временные error-probes и резервные
копии игнорируемых generated types не входят в коммит.

## Последовательность и проверка

030 завершена. T001–T005 последовательно.
Перед кодом анализ; затем конфигурация, controlled TS2322 в каждой области,
проверка списка файлов через TypeScript API, clean typegen и итоговая команда.
Дополнительно временный Playwright matcher-пример должен отвергнуть DOM matcher,
а штатные Vitest DOM-тесты должны успешно проверяться.
Новые файлы используются как probes для проверки glob, а не только уже импортированные.

Для clean проверки сохранить только generated type directories и next-env.d.ts
в игнорируемом test-results/031-type-backup. Проверить абсолютные пути внутри
репозитория до Move-Item. Убедиться, что старые типы отсутствуют; выполнить
npm run typecheck. Резервные копии остаются игнорируемыми, product files не затрагиваются.
Проверить отсутствие случайных config-правок Next после генерации.

Итог: npm run typecheck, npm test, npm run lint, npm run lint:styles,
npm run format:check; runtime не меняется, полный browser build не требуется.
TDD не заявляется для конфигурации. Если потребуются бизнес-правки — отдельный Red-контракт.
