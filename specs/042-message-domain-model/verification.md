# Проверка 042: чистая модель сообщений и статусов

Дата: 2026-10-03. Локальная реализация, регрессия и предкоммитный анализ завершены; GitHub CI ожидает commit/push.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до кода | Passed: 913 путей, SHA-256 до/после `64d3aba9938bdda04827c1d98055623f7059bf775a9a89007777d6ffc55fb607`, unchanged; findings 0 |
| Baseline целевой integration | Passed: 26/26 до правок |
| Составной identity Red | Passed: 2/6 новых unit-проверок обнаружили коллизию одинакового idMessage в разных chatId и provenance |
| Status mismatch Red | Passed: 1/9 обнаружил применение статуса к чужому сообщению |
| Чистая модель Green | Passed: 9/9 unit-проверок после реализации |
| Целевая integration | Passed: 26/26 после первого Green |
| Полный Vitest | Passed: 58/58, 14 файлов |
| Полный integration | Passed: 363/363 |
| Browser Query | Passed: 45/45 в изолированном прогоне |
| Production E2E | Passed: 110/110 с production build |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed |
| Граф Client Components → server runtime | Passed: 28 client roots, 228 source TS/TSX, запрещённых runtime-путей 0 |
| Повторный read-only анализ | Passed: 915 путей, SHA-256 до/после `cfcf5b11fb540d644798a64c38d35291cde877d0f8114555d6bd665571d01c5e`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | NotRun до push кода |

Модель принимает проверенные факты с явным источником, использует пару chatId/idMessage для сообщений, ранних статусов и provenance. Совместимый адаптер сохраняет прежние вызовы кеша. Непроверенные assertions в обработке статусов заменены явными guards. Тесты подтверждают приоритеты источников, монотонность статуса, TTL/лимит ранних фактов, изоляцию чатов и отсутствие мутаций входов. Внешний DTO, HTTP API и UI не менялись.

Playwright Query, integration и E2E выполнялись последовательно из-за пересекающихся каталогов артефактов; отдельное исправление организации фикстур остаётся в 050.