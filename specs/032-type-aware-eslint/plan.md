# Implementation Plan: Async lint 032

Spec: [spec.md](spec.md). Дата: 2026-10-03.
Пользователь разрешил весь согласованный цикл, commit/push в refactor.

## Summary и Technical Context

Добавить два полезных type-aware правила в существующий ESLint, передав
три tsconfig из 031. Только TS/TSX/MTS получают parserOptions.project;
JS-конфигурации сохраняют текущую проверку.
Текущие Node 24, ESLint 9, TypeScript 5.9, typescript-eslint 8.71 через Next.
Выбор и ограничения: [research.md](research.md).

## Конституция до и после решения

C1 PASS — выбор объяснён; C2 PASS — один шаг качества async;
C3 PASS — полный комплект/анализ перед реализацией; C4 PASS — commit/push разрешены;
C5 PASS — без установок/БД; C6 PASS — явный feature, фиктивные тестовые данные;
C7 PASS — реальные invalid/valid/exception примеры + регрессия;
C8 PASS — два правила, без полного strict preset и новой инфраструктуры.

## Модель/контракты

[data-model.md](data-model.md), [contracts/async-lint.md](contracts/async-lint.md),
[quickstart.md](quickstart.md). Promise продолжают ожидаться там, где вызывающий
код зависит от завершения. Sync event adapters лишь обозначают игнорирование
возвращаемого значения React; ошибка уже принадлежит async операции или Query.

## Файлы реализации

- eslint.config.mjs — project/parser options и два правила.
- docs/CODE_STYLE.md — действующие проверки и границы void.
- Следующие файлы — sync adapters без изменения операций:
- src/components/ChatHistoryState/ChatHistoryState.tsx
- src/components/ChatListRecovery/ChatListRecovery.tsx
- src/components/LoginForm/LoginForm.tsx
- src/components/LogoutButton/LogoutButton.tsx
- src/components/MessageComposerFeedback/MessageComposerFeedback.tsx
- src/components/NotificationNotice/NotificationNotice.tsx
- src/components/RecipientSearchForm/RecipientSearchForm.tsx
- src/lib/query/create-query-session.ts
- tests/fixtures/query-app/components/HistoryProbe/HistoryProbe.tsx
- tests/fixtures/query-app/components/QueryProbe/QueryProbe.tsx
- tests/fixtures/query-app/components/SelectionProbe/SelectionProbe.tsx
- tests/fixtures/query-app/components/SessionOverlayProbe/SessionOverlayProbe.tsx

## Документы и последовательность

specs/032-type-aware-eslint: spec.md, checklists/requirements.md, research.md,
plan.md, data-model.md, contracts/async-lint.md, quickstart.md, tasks.md,
analysis.md, verification.md. docs/refactoring-roadmap.md отражает результат.
031 завершена. Сначала анализ, затем config/adapters, контрольные примеры,
регрессия и предкоммитный рефакторинг/ревью.
Исправление новой бизнес-ошибки не смешивается с этим шагом: отдельный контракт
и подтверждённый Red до такого изменения. Здесь меняется только граница вызова.

## Проверки

Реальный конфиг: lost Promise, Promise в if, async forEach/JSX — ошибки;
await/return/catch, synchronous callbacks — допустимы;
явный void у уже обрабатывающей ошибки операции — документированное исключение.
Проверить файлы src, unit/component/query, все TS/MTS configs и JS config.
Временные probes не коммитятся, постоянный дополнительный lint runner не создаётся.

npm run lint, typecheck, lint:styles, format:check, npm test;
npm run test:integration; npm run test:query (45 сценариев).
Целевой E2E: login-flow, login-form-safety, login-form, logout-flow,
recipient-search, recipient-search-ui, message-composer, chat-list-ui.
Query/E2E запускаются последовательно со своими production build.
Known DEFECT-01 focus не скрывается retry, но не относится к изменённым обработчикам.
