# Runner and coverage contract 051

До удаления: исходные `tests/integration/*.spec.ts` остаются доступными Playwright, новые `.test.ts` запускаются Vitest. Результаты обоих наборов сравниваются по `scenario-map.json`; 351 B028 ID + 15 N051 ID должны присутствовать, заголовки и значимые assertions сохранены. Ошибка одного нового сценария блокирует удаление старого файла.

После Green: `npm test` включает проекты `node`, `integration`, `dom` ровно один раз; `npm run test:integration` выбирает только integration проект; `npm run test:unit` — только node, `npm run test:component` — dom. Playwright integration config и старые `.spec.ts` отсутствуют; Query/E2E сохраняют настоящие HTTP/cookie/Web Locks/geometry. CI quality запускает `npm test` единожды, browser job — Query/E2E.

`expect.poll` остаётся асинхронным и awaited; project timeout должен покрыть прежние ожидания, не подавляя зависание. `test.afterEach` переносится в явный Vitest `afterEach`. Node setup очищает timer/global state. Ожидаемые значения в `tests/protocol.constants.ts` остаются независимыми от production. Неисправный важный assertion должен дать целевое падение в кратком временном отрицательном контроле.
