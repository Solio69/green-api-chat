# Модель тестового окружения

- Project node: tests/unit/**/*.test.ts, Node environment, без document/window и RTL setup.
- Project dom: tests/component/**/*.test.{ts,tsx}, jsdom, development React, DOM matchers и cleanup.
- Сценарий миграции: постоянный ID baseline, исходный путь/title, новый путь/title, эквивалентные assertions, статус переноса.
- QueryClient: создаётся внутри отдельного теста; принадлежит только ему; по завершении очищается, отменяя активные queries.
- Run: команда, UTC, exit code, Passed/Failed/Blocked/NotRun и краткое доказательство.

БД и публичная модель приложения не меняются. Исходный реестр 028 остаётся историческим baseline; текущее отображение переноса хранится в migration-map.md задачи 029.
