# Проверка 034

Дата: 2026-10-03. Локальная реализация Passed; remote CI NotRun.

| Проверка | Результат |
| --- | --- |
| YAML browser/quality jobs, actions SHA, events, команды и reports | Passed |
| Исправленный тест фокуса до кода | Red: toBeFocused, exit 1; production build, сервер и fixture исправны |
| Тот же тест после кода | Green: 1/1 |
| Два сценария фокуса по 10 повторов | Passed: 20/20, retries 0 |
| Полный E2E production | Passed: 110/110 |
| Query | Passed: 45/45 |
| HTML отчёты query и E2E после обоих наборов | Passed: оба index.html сохранены |
| Typecheck, ESLint, Stylelint, Prettier, Vitest | Passed; Vitest 15/15 |
| Mock поставщика | Passed: фиктивный ожидаемый origin, два неожиданных origin блокируются до сетевого вызова |
| Чистый GitHub browser+quality | NotRun |
| Контрольное падение browser/trace и восстановление | NotRun |

Исходный DEFECT-01: baseline 028 зафиксировал 1 сбой из 3 повторов.
Десять повторов старого теста до исправления прошли — это не
свидетельство устранения нестабильности. Первый новый тестовый набросок
не возвращал мобильную панель к списку; его падение признано невалидным
Red и тест исправлен. Настоящий Red воспроизвёл исходные шаги при
задержанном ResizeObserver. После добавления window resize listener
новый тест, старый тест и внешний фокус прошли; listener удаляется
в cleanup эффекта. Никаких retry или ослабления assertions нет.

Query и E2E используют разные сборки и порты 3102/3101; E2E webServer
собирает production один раз. Отчёты и логи лежат в раздельных каталогах;
Playwright не удалил query HTML при E2E. Provider fixture через
контрольный оригинальный fetch показала 0 сетевых вызовов для GREEN-API.
Реальные реквизиты не применялись. Следующий шаг — предкоммитное ревью,
публикация и удалённая приёмка positive/negative/restore.
Коммит: fix: run isolated browser suites in CI.
