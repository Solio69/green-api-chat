# Приёмка 035

Из корня проекта: `git ls-files src tests` — точный инвентарь tracked
файлов; `ownership-map.csv` содержит ровно эти пути и непустые
owner/target/task. Обновление проекта после 035 требует сверки карты
на 054. Текущий граф проверяется AST-обходом импортов и отдельно
записывает существующие циклы; целевой граф из
`contracts/dependency-boundaries.md` проверяется как DAG.

Проверить `docs/architecture.md`, `docs/CODING_RULES.md`, переходы
036–049, исходные `spec.md` задач и отсутствие заявлений о
выполненном переносе. Запустить `npm run format:check`, `git diff
--check`, затем review точных файлов. После commit/push в refactor
проверить фактический GitHub Actions head_sha и обе jobs.

Новые зависимости и продуктовые функции не входят в 035.
