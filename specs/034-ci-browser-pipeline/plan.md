# Implementation Plan: Browser CI 034

Spec: [spec.md](spec.md). Дата: 2026-10-03.
Пользователь поручил полный цикл commit/push в refactor.

## Summary и Technical Context

Добавить browser job в действующий quality.yml: Node24, npm ci,
Playwright Chromium с системными библиотеками, последовательные query 45
и production E2E 109+ сценариев. Исправить DEFECT-01 после поведенческого Red:
фокус после desktop→mobile должен возвращаться к выбранному чату при
задержанном ResizeObserver. Реальный GREEN-API не используется.
Варианты: [research.md](research.md).

## Конституция до/после проектирования

C1 PASS: решения и издержки представлены; известное поведение фокуса согласовано.
C2 PASS: одна отдельная задача browser CI, фокус нужен для её зелёной приёмки.
C3 PASS: полный комплект и read-only анализ до кода; авторизация переписки.
C4 PASS: commit/push только refactor, main не меняется.
C5 PASS: локальных установок нет; Chromium с deps только согласованный CI runner.
C6 PASS: фиктивные GREEN-API данные, без secrets, явная feature.
C7 PASS: Red для фокуса; CI valid/invalid/restore и фактический head.
C8 PASS: штатные Playwright configs и один browser job, без новых dependencies.

## Файлы

- .github/workflows/quality.yml — browser job, установка, команды, отчёты.
- playwright.query.config.ts — HTML query report в test-results/query-report.
- tests/e2e/fixtures/fake-green-api.ts — fail-fast на неожиданном GREEN-API origin.
- tests/e2e/conversation-selection.spec.ts — детерминированная проверка фокуса.
- src/components/ChatWorkspace/use-workspace-focus.ts — fallback window resize
  с cleanup; точное исправление после Red.
- README.md — наборы и browser CI.
- docs/refactoring-roadmap.md — фактический этап R03.
- specs/034-ci-browser-pipeline: spec/checklist/research/plan/data-model/
  contracts/browser-ci.md/quickstart/tasks/analysis/verification.

Продуктовые функции, package/lockfile, main и секреты не меняются.

## Контракт и изоляция

См. [data-model.md](data-model.md),
[contracts/browser-ci.md](contracts/browser-ci.md), [quickstart.md](quickstart.md).
Browser job получает contents:read и persist-credentials:false.
Node 24/npm 11 проверяются до npm ci. Timeout 20 минут.
Логи установки и тестов пишутся в test-results/browser.
Query порт 3102, root E2E порт 3101; две сборки разных приложений,
без повтора одной конфигурации. Retry 0, workers 1.
Browser job без needs quality: независимые jobs проверяются параллельно,
общий GitHub run success требует успеха обеих.
Никаких env с реальными реквизитами.

## Порядок и проверки

033 завершена → полный комплект → read-only анализ → добавить фокус-тест
и подтвердить поведенческий Red (существующая нестабильность сама по себе
зафиксирована в 028; свежие 10 повторов Passed) → минимальное исправление
и Green → конфигурация browser job/фикстуры/report.
Локально typecheck, lint, styles, format, Vitest, query 45, полный E2E
в том числе focus repeated. Сборка production выполняется в E2E webServer.
Статическая YAML-проверка сравнит jobs, команды, изоляцию output и upload.
После review commit/push → фактический GitHub green browser+quality →
контрольный browser failure с trace/artifact → восстановление и green →
итоговый отчёт, roadmap, commit/push, head status.
Намеренный failed run является ожидаемой приёмкой, не текущим зелёным CI.

Если нестабильный исходный тест после исправления остаётся красным,
не добавлять retry и не скрывать failure; диагностировать trace.
Если browser installation/Actions ограничен внешним сервисом, отразить Blocked,
не покупать ресурс и продолжать независимую работу.
Manual dispatch до main и fork PR остаются NotRun.
