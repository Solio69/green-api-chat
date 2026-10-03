# Quickstart 048

Из корня репозитория без новых зависимостей:

```powershell
$env:SPECIFY_FEATURE_DIRECTORY = 'specs/048-chats-feature-migration'
$taskFeature = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $env:SPECIFY_FEATURE_DIRECTORY))
& '.\.specify\scripts\powershell\check-prerequisites.ps1' -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory $taskFeature
npx playwright test tests/integration/chat-query.spec.ts tests/integration/chats-api.spec.ts tests/integration/session-chat-facts.spec.ts --config playwright.integration.config.ts
npx playwright test tests/query/chat-query.spec.ts tests/query/session-chat-overlay.spec.ts --config playwright.query.config.ts
npx playwright test tests/e2e/chat-list-ui.spec.ts
npm test
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
npm run test:integration
npm run test:query
npm run test:e2e
```

Точные тестовые файлы дополнить после инвентаря до кода. Категории Playwright запускать последовательно из-за общего `test-results`; результаты фиксировать в verification.md.
