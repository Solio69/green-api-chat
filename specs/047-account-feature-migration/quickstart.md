# Quickstart 047

Из корня репозитория без новых зависимостей:

```powershell
$env:SPECIFY_FEATURE_DIRECTORY = 'specs/047-account-feature-migration'
$taskFeature = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $env:SPECIFY_FEATURE_DIRECTORY))
& '.\.specify\scripts\powershell\check-prerequisites.ps1' -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory $taskFeature
npx playwright test tests/integration/account-profile.spec.ts tests/integration/get-account-settings.spec.ts tests/integration/home-flow.spec.ts --config playwright.integration.config.ts
npx playwright test tests/e2e/account-profile.spec.ts
npm run test:unit
npm run test:component
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
npm run test:integration
npm run test:query
npm run test:e2e
```

Точные script names проверить по `package.json` перед запуском. Playwright категории запускать последовательно из-за общего `test-results`. Полный regression и GitHub CI фиксируются в verification.md.
