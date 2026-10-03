# Воспроизведение исходной проверки

Команды выполняются в корне проекта на Windows с PowerShell 7, установленными зависимостями проекта и Chromium соответствующей версии Playwright. Установки агент не выполняет.

## Контекст

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
node --version
npm --version
```

Не выводить содержимое `.env*`. E2E-конфигурация сама передаёт фиктивный SESSION_PASSWORD и подключает fake GREEN-API через NODE_OPTIONS. Не заменять эти настройки реальными реквизитами. Если NODE_OPTIONS уже задан пользователем, проверить наличие этой настройки без вывода чувствительных значений и сохранить её назначение.

## Обнаружение тестов

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.integration.config.ts --list --reporter=json
node node_modules/@playwright/test/cli.js test --config playwright.query.config.ts --list --reporter=json
node node_modules/@playwright/test/cli.js test --list --reporter=json
rg --files tests -g '*.spec.ts' -g '*.tests.ps1'
```

Сверить JSON и список файлов с `test-inventory.json` и `test-inventory.md`. Развёрнутые параметризованные сценарии считаются отдельно. PowerShell-набор учитывается отдельно по V01–V12.

## Последовательный прогон

```powershell
npm run typecheck
node node_modules/typescript/bin/tsc --noEmit --incremental false -p tests/fixtures/query-app/tsconfig.json
npm run lint
npm run lint:styles
npm run format:check
npm run test:integration
npm run test:query
npm run test:e2e
pwsh -NoProfile -File tests/spec-kit/workflow.tests.ps1
```

Query/E2E запускаются последовательно и требуют свободных портов 3102 и 3101. Занятый пользовательский процесс не завершать автоматически. Основная production-сборка выполняется командой `npm run build` внутри E2E webServer; её отдельный результат и успешный старт фиксируются из того же запуска. Повторная сборка с идентичным окружением не нужна. Если E2E не дошёл до сборки, её статус записывается отдельно.

Типы корня и query-app проверяются раздельно: текущая штатная команда не охватывает все окружения. Устранение этого пробела относится к 031.

## Проверка документов

```powershell
node node_modules/prettier/bin/prettier.cjs --ignore-path NUL --check docs/refactoring-roadmap.md 'specs/028-refactor-test-baseline/**/*.md' specs/028-refactor-test-baseline/test-inventory.json
git diff --check
git diff --cached --check
```

Отдельно проверить локальные ссылки, уникальность scenario ID, полноту списка файлов и соответствие totals реальным результатам. Отчёты Playwright и сырые временные логи не включать в commit. Сводка и ограничения сохраняются в baseline/verification. Перед commit ещё раз проверить ветку `refactor` и точный список staged paths.
