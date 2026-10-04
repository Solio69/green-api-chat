# Проверка 035: границы модулей

Дата: 2026-10-03. Локальная проверка и удалённый CI Passed.

| Проверка | Результат |
| --- | --- |
| Spec Kit feature directory и полный комплект | Passed: 035, spec/checklist/research/plan/data-model/contracts/quickstart/tasks/analysis |
| Read-only анализ | Passed: 828 путей, SHA-256 до/после `43261ccf7b9c0dab12643496b41832b3bb890e4c3af211c755c12911af526000`, unchanged |
| CSV против `git ls-files src tests` | Passed: ровно 360 уникальных строк = 251 src + 109 tests; пропусков/лишних путей нет |
| Владелец/target/task/disposition | Passed: все 360 строк непустые; 10 смешанных файлов помечены split |
| Целевой граф импортов | Passed: 9 узлов, DAG; текущий файловый цикл описан как переходный |
| Локальные Markdown-ссылки | Passed: 0 отсутствующих ссылок в новом комплекте, архитектуре и CODING_RULES |
| `npm run format:check`, `git diff --check` | Passed |
| GitHub Actions run 37123933756 на 91c5101 | quality и browser success, отчёты опубликованы |

Ручное ревью проверило Next route paths, общие UI-компоненты с двумя
потребителями, QueryProvider и файлы, где DTO смешаны с Query-ошибками
или серверными реквизитами. `chats/types.ts`, `history/types.ts`,
`notifications/types.ts`, `sending/types.ts` и связанные constants
не выдаются за уже чистую модель. Архитектура задаёт будущие границы;
исходники/тесты в 035 не перемещены и поведение не менялось.

Архитектурная карта опубликована в commit 91c5101; GitHub run 37123933756
подтвердил обе jobs. Документирующий итоговый commit проверяется отдельно.
