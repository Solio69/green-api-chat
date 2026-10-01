# Implementation Plan: ESLint и Prettier

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-01
**Статус**: Реализован и проверен
**Согласование spec.md**: Согласованные правила и первая задача из обсуждения.
**Разрешение на реализацию**: Явно получено заранее; включает нужные установки
после завершения соседнего треда. Завершение соседа подтверждено.

## Summary

Дополнить ESLint готовыми правилами и настроить Prettier semi false.
Новая логика не создаётся. Существующие исходники, тесты и конфигурации приводятся
к правилам с сохранением директив, контрактов и ожиданий. CODE_STYLE.md остаётся
до отдельной задачи миграции; автоматические настройки описываются ссылками на конфиги.

## Considered Options

| Вариант            | Преимущества                            | Ограничения                       | Выбор      |
| ------------------ | --------------------------------------- | --------------------------------- | ---------- |
| ESLint + Prettier  | Уже установлен, есть Next/React presets | Смысловые правила требуют ревью   | Выбран     |
| Новый общий линтер | Возможен единый интерфейс               | Изменение стека, SCSS-ограничения | Не выбран  |
| Custom rules       | Можно выразить личные AST-ограничения   | Поддержка и отдельные тесты       | Вне объёма |

## Technical Context

Node.js 24, npm 11, Next.js 16.3.7, ESLint 9.39.5, Prettier 3.9.9.
Единственная явно добавляемая devDependency — уже установленный eslint-plugin-import
2.32.0. Использовать npm install --save-dev --save-exact eslint-plugin-import@2.32.0
--ignore-scripts; lock-файл синхронизировать без обновления остальных версий.
Команда установки разрешена пользователем конкретно для этой задачи.
БД, внешние API и реальные реквизиты не используются.

## Constitution Check

| Принцип | Статус                   | Основание                                                                       |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| C1      | PASS                     | Правила и варианты обсуждены на русском.                                        |
| C2      | PASS                     | Одна задача; Stylelint, структура и skill исключены.                            |
| C3      | PASS                     | Предварительная явная авторизация из переписки сохраняется.                     |
| C4      | PASS                     | Git только read-only; исходный index hash фиксируется.                          |
| C5      | PASS с явным исключением | Пользователь разрешила необходимые установки; БД и прочие задачи исключены.     |
| C6      | PASS                     | Каталог 007 явный, реальные секреты не читаются.                                |
| C7      | PASS                     | Положительные/отрицательные примеры конфигурации, регрессия и read-only анализ. |
| C8      | PASS                     | Без custom rules, нового тест-раннера и общей миграции правил.                  |

## Research and Design

- [research.md](research.md) — факты, первичные источники и решения.
- [contracts/tooling.md](contracts/tooling.md) — точные области, команды и готовые правила.
- [quickstart.md](quickstart.md) — запуск из NPM Scripts, смысл проверок.
- data-model.md неприменим: новые продуктовые данные отсутствуют.
- UI-референс неприменим: внешний вид формы не меняется.

## Project Structure

Конфигурации/документы:

- eslint.config.mjs — добавить import plugin и блоки готовых JS/TS правил.
- prettier.config.mjs — добавить semi false; сохранить остальные параметры.
- package.json — lint:fix и прямая devDependency.
- package-lock.json — согласовать с зависимостью.
- README.md — пояснить lint:fix/format и автоматические правила.
- docs/CODE_STYLE.md — ссылаться на активные конфиги, сохранить смысловые правила;
  не удалять и не проводить полный перенос.
- specs/007-eslint-prettier/spec.md, checklists/requirements.md, research.md, plan.md,
  contracts/tooling.md, quickstart.md, tasks.md, analysis.md, verification.md —
  артефакты текущей задачи.

Исходники и тесты:

- `tests/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/integration/session.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/integration/login-route.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/integration/home-flow.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/integration/get-state.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/integration/auth-flow.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/ui/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/e2e/login-form.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/e2e/login-form-safety.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/e2e/login-flow.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/e2e/home.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `tests/e2e/health.spec.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/app/page.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/routes/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/CredentialField/index.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/CredentialField/CredentialField.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/app/login/page.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/app/layout.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/app/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/TokenVisibilityButton/TokenVisibilityButton.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/components/TokenVisibilityButton/index.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/http/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/LoginForm/LoginForm.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/components/LoginForm/index.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/LoginForm/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/green-api/get-state.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/green-api/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/components/SubmitButton/SubmitButton.tsx` — исправления по активным ESLint-правилам и Prettier.
- `src/components/SubmitButton/index.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/app/api/health/route.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/api/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/auth/session.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/auth/resolve-login.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/auth/resolve-home.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/auth/handle-login-request.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/lib/auth/constants.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/app/api/auth/login/route.ts` — исправления по активным ESLint-правилам и Prettier.
- `src/app/api/auth/end-session/route.ts` — исправления по активным ESLint-правилам и Prettier.
- next.config.ts, playwright.config.ts, playwright.integration.config.ts,
  eslint.config.mjs, prettier.config.mjs — тот же кодстайл для конфигураций.
- README.md форматируется действующим Prettier; SCSS не получает новых правил.
- AGENTS.md, constitution, служебные scripts/skills, старые specs и тестовые
  фикстуры PowerShell не меняются этой задачей.

## Tasks and Dependencies

Baseline и согласованная spec → технические документы → read-only анализ →
конфигурации/нужная зависимость → проверка готовых правил примерами →
один пакет автоисправлений → обновление документов → итоговые проверки →
ревью и отчёт. TDD не применяется к конфигурации или чистому рефакторингу:
существующий зелёный baseline подтверждён до изменения кода.

## Verification

- ESLint.lintText: корректный код и нарушения import/order, newline-after-import,
  arrow-body-style, prefer-template, no-unneeded-ternary, явного any,
  type-only imports и unused vars; пути src, tests и корневой mjs-конфигурации.
- Prettier check/format: ;, ASI-опасная строка; проверка фиксированной точки.
- CLI eslint-config-prettier на TSX, TS, test и mjs: нет конфликтов.
- Повторные lint:fix и format после исправлений: hashes JS/TS не меняются.
- Итоговые npm run lint, npm run format:check, npm run typecheck.
- npm run test:integration: 66 Passed; npm run test:e2e: 24 Passed.
  E2E запускает production build; сначала проверить отсутствие dev-сервера в этой папке.
- Прочитать diff относительно baseline, проверить отсутствие изменения контрактов,
  секретов и операций записи Git index; внешнее изменение общего staging фиксируется без отката. git diff --check и --cached --check только read-only.
- После правок документов выполнить read-only analyze и отдельно сохранить отчёт.
  verification использует фактические Passed/Failed/Blocked/NotRun.

## Post-design Constitution Check

C1–C8 повторно PASS с тем же явно разрешённым исключением C5.
Никакой новой авторизации на неопределённый объём не требуется.
Генерируемые .next/test-results не входят в сохранённый код; Git index сравнивается.

## Complexity Tracking

Один существующий плагин становится прямой зависимостью.
Нет собственного ESLint-плагина, нового раннера, CI и проверки структуры.
