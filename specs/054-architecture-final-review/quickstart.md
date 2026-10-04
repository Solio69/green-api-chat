# Quickstart 054

Из корня проекта задать `SPECIFY_FEATURE_DIRECTORY=specs/054-architecture-final-review` и абсолютный `ExpectedFeatureDirectory` для Spec Kit. Прочитать [inventory](inventory.md), [69-file migration map](migration-map.json), [plan](plan.md), [contracts](contracts/architecture-boundaries.md). Провести read-only analyze, записать `analysis.md` отдельным действием.

До реализации зафиксирован baseline 053: Vitest 470/470, Query 37/37, E2E 112/112 и оба CI jobs. После связанной серии правок: `npm run typecheck`, `npm run lint`, `npm run lint:styles`, `npm run format:check`, `npm test`, затем последовательно `npm run test:query` и `npm run test:e2e`. Проверить `npm run build` отдельно только если E2E production build недоступен (E2E уже его включает); сравнить graph, старые пути, lint positive/negative examples и exact map. Review staged diff, code commit/push `refactor`, обе CI jobs/artifacts, затем verification и документационный commit/push.
