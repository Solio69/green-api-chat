# Запуск проверок 029

Корень проекта: D:\Pet-projects\green-api-chat. Node 24.14.1, npm 11.11.0.

## Установка

По AGENTS/C5 команду выполняет пользователь; агент может выполнить её только после прямого исключения для этой задачи. Версии выбраны в research.md, runtime dependencies не меняются.

```powershell
npm install --save-dev --save-exact vitest@5.0.3 vite@8.3.2 @vitejs/plugin-react@6.1.1 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1 jsdom@29.1.1
```

## Обычная работа

```powershell
npm test
npm run test:unit
npm run test:component
npm test -- tests/unit/recipient-label.test.ts
npm test -- -t "normalized submitted username"
npm run test:watch
npm run typecheck:tests
```

Watch завершить q. Пустой/ошибочный фильтр не считается успешным прогоном.

## Приёмка

Исходный прогон старого файла до удаления зафиксирован в verification.md; текущие сценарии находятся в tests/unit/recipient-label.test.ts.
Запустить оба новых проекта по отдельности и вместе. В unit-тесте временно заменить ожидаемое @demo_user на @wrong_user; выполнить только этот файл, получить assertion failure/exit 1, восстановить файл и повторить полный npm test.

```powershell
npm run test:integration
npm run test:query -- --list
npm run test:e2e -- --list
npm run test:e2e -- tests/e2e/recipient-search-ui.spec.ts
npm run typecheck
npm run typecheck:tests
npm run lint
npm run lint:styles
npm run format:check
node node_modules/prettier/bin/prettier.cjs --ignore-path NUL --check "specs/029-vitest-test-foundation/**/*.md" docs/refactoring-roadmap.md
git diff --check
```

Команды с общими сборками/отчётами выполнять последовательно. Не читать .env.local и не использовать реальные реквизиты. E2E запускается с имеющимся fake provider. Сбой фокуса DEFECT-01 задачи 028 этим целевым прогоном не проверяется.

Разовое исключение пользователя 2026-10-03: агенту разрешена установка восьми devDependencies по quickstart и завершение проверок/commit. Общие правила проекта не изменяются.
