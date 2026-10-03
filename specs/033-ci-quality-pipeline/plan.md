# Implementation Plan: CI качества

Spec: [spec.md](spec.md). Дата: 2026-10-03.
Пользователь поручил реализацию всего согласованного плана, commit/push в refactor.

## Summary и Technical Context

GitHub Actions quality job: npm ci → typecheck → ESLint → Stylelint →
Prettier → Vitest → остающийся Playwright integration.
Node 24/npm 11, ubuntu-24.04, официальные actions v7 с точными SHA.
Браузерные бинарники и реальные GREEN-API/SESSION_PASSWORD здесь не нужны.
Варианты и основания: [research.md](research.md).

## Конституция до и после проектирования

C1 PASS: решения и remote negative контроль объяснены.
C2 PASS: только быстрый CI, browser отдельно в 034.
C3 PASS: полный комплект/анализ перед workflow; авторизация имеется.
C4 PASS: явное разрешение push/commit только refactor, main не меняется.
C5 PASS: локальных установок нет; npm ci на GitHub — необходимая часть согласованного CI.
C6 PASS: явная feature, фиктивные данные, минимальные permissions.
C7 PASS: локальные и реальные remote статусы разделены; positive/negative/restore.
C8 PASS: штатный workflow без собственного CI runner или новых dependencies.

## Файлы

- .github/workflows/quality.yml — новый workflow, включая временный контроль только на этапе приёмки.
- README.md — команды, triggers, отчёты, условие manual dispatch.
- docs/refactoring-roadmap.md — фактическая готовность 033.
- specs/033-ci-quality-pipeline/spec.md, checklists/requirements.md — статус.
- В том же feature: research.md, plan.md, data-model.md, contracts/quality-ci.md,
  quickstart.md, tasks.md, analysis.md, verification.md.

Продуктовый код, package/lockfile и test config не меняются.
Секреты/генерируемые логи не коммитятся.

## Модель/контракт

[data-model.md](data-model.md), [contracts/quality-ci.md](contracts/quality-ci.md),
[quickstart.md](quickstart.md).
Push main/refactor + PR + workflow_dispatch; contents:read,
persist-credentials:false; cache npm не заменяет npm ci.
Логи каждой команды пишутся в test-results/quality и загружаются отдельным
artifact quality-<run_attempt>, retention 7 дней. Bash -e -o pipefail.
Checkout failure виден в Actions даже если artifact создать невозможно.

## Порядок

032 завершена. Полный комплект → read-only анализ → workflow/README →
локальная проверка структуры и эквивалентных команд → initial commit/push →
удалённый зелёный прогон → временный negative step и ожидаемый failed run →
восстановление workflow и зелёный run → фактический отчёт и final docs commit/push.
Каждый commit проходит review; намеренно ошибочный runner-файл существует
только как контролируемая проверка и отсутствует в финальном workflow.

## Проверки

YAML разбирается установленным js-yaml, проверяются triggers, SHA,
permissions, timeout/concurrency, npm ci, все команды, pipefail и upload.
Локальный baseline всех команд уже Passed в 032; новый format:check включает YAML.
Контрольный TS2322 проверяется общей npm run typecheck до remote negative commit.
GitHub API проверяет head_sha, conclusions job/steps и наличие artifact.
Подтверждаются отсутствие cache в первом clean runner и отсутствие repo secrets.

При недоступности Actions/лимита фиксируется реальный Blocked remote checkpoint,
платные услуги не включаются; независимые задачи могут продолжаться.
Ручной dispatch до merge в main остаётся NotRun по ограничению GitHub и не
подменяет успешный push-run. PR из fork не создаётся ради проверки;
permissions и отсутствие secrets проверяются статически.
