# Проверка 057

Из D:\Pet-projects\green-api-chat, без установки пакетов.

Реализация выполнена локально. Фактические результаты команд и ограничение штатной проверки форматирования записаны в [verification.md](verification.md).

1. Red и Green: `npm test -- tests/unit/notification-connection-model.test.ts tests/component/notification-notice.test.tsx tests/component/provider-lifecycle.test.tsx tests/integration/polling-connection.test.ts`.
2. Браузерный сценарий входит в итоговый `npm run test:e2e`, который сам собирает production и использует fake GREEN-API.
3. Итог: `npm test`, `npm run lint`, `npm run lint:styles`, `npm run typecheck`, `npm run test:e2e`.
4. Prettier — затронутые исходники/тесты и README; полный `--check . --end-of-line auto` подтверждает формат при смешанных окончаниях строк. Каталог specs/ исключён штатным .prettierignore. Дополнительно `git diff --check`.
5. Ручной результат: при повторных сбоях receive плашки нет, окно не прыгает; отправка показывает «Отправляется…», затем результат именно своего запроса.
6. Для диагностики редактора: `node node_modules/typescript/bin/tsc --noEmit --project tests/tsconfig.json`. Этот проект наследует алиас `@/` и DOM setup; после изменения конфигурации перезагрузить окно VS Code для обновления TypeScript diagnostics.

Сетевые ошибки production этой проверкой не диагностируются. Commit/push выполняет пользователь отдельно.
