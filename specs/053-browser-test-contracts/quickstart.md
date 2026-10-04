# Quickstart 053

Работать из корня проекта с `SPECIFY_FEATURE_DIRECTORY=specs/053-browser-test-contracts` и абсолютным `ExpectedFeatureDirectory` для Spec Kit scripts. Сверить [inventory](inventory.md), [browser map](browser-map.json) и [selector audit](selector-audit.md). До кода — read-only `speckit-analyze` и отдельная запись `analysis.md`.

После серии правок: `npm run typecheck`; `npm run lint`; `npm run lint:styles`; `npm run format:check`; `npm test`; затем **последовательно** `npm run test:query` и `npm run test:e2e`. Discovery `npm exec -- playwright test --list --reporter=json` для E2E и `npm exec -- playwright test --config playwright.query.config.ts --list --reporter=json` для Query; сравнить ID/title/path с картой 149. Проверить `retries: 0`, browser reports и CI artifact, staged diff; записать результаты в `verification.md`. Commit/push только `refactor` по разрешению пользователя.
