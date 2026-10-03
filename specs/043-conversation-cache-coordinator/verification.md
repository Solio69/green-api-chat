# Проверка 043: координатор кеша переписки

Дата: 2026-10-03. Локальная реализация, полная регрессия и предкоммитный анализ завершены; GitHub CI ожидает commit/push.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до кода | Passed: 21 путь, SHA-256 до/после `d44cf53fb68d4d1c7710684e2815f390f2c60986a2d9d8b4a9c4644cdbe18388`; одно MEDIUM замечание устранено; повторный hash `a09a7b5d793068bc5c8e3d34ab1c19fe1e3823b31537cce239457992d2d10cd7`, findings 0 |
| Целевая integration baseline | Passed: 29/29 до правок |
| Целевой Query baseline | Passed: 5/5 до правок |
| Новый Query Red | Passed: один HTTP-запрос истории при нескольких потребителях дал 4 записи message cache вместо 1; ошибка поведенческая |
| Новый Query Green | Passed: 1/1, один запрос → одна запись |
| Целевая integration | Passed: 32/32, включая гонку history/live, accepted и incoming/replay/ACK |
| Целевой Query | Passed: 6/6, включая повторное открытие, A→B→A, ошибку и retry |
| Typecheck app/tests/query | Passed |
| ESLint, Stylelint, Prettier | Passed |
| Полный Vitest | Passed: 58/58, 14 файлов |
| Полный integration | Passed: 366/366 |
| Полный Browser Query | Passed: 46/46 в отдельном Playwright-прогоне |
| Production E2E | Passed: 110/110 с production build |
| Граф Client Components → server runtime | Passed: 28 client roots, 229 source TS/TSX, запрещённых runtime-путей 0 |
| Повторный read-only анализ | Passed: 17 файлов, SHA-256 до/после `c33bc2ebe51dd85132a3002db89afc8ffd9b2dea1121a87ba37222cb307136eb`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | NotRun до push кода |

История теперь применяется один раз внутри общего Query-запроса, без per-consumer QueryCache-подписки. Координатор последовательно применяет историю, принятое сообщение и уведомление к существующим проекциям; для входящего message/temporary chat/unread доступны до решения об ACK. Request key с accessId, отмена, сохранение прежней модели при ошибке, manual refetch и recovery подтверждены Query/E2E. Внешний HTTP DTO, UI и семантика unread не менялись. Тесты используют фиктивные данные.

Playwright integration, Query и E2E выполнялись последовательно из-за пересекающихся каталогов артефактов; организация фикстур остаётся задачей 050.