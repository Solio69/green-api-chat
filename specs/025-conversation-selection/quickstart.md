# Проверка 025

Собственные проверки выполнены: результаты и TDD в verification.md.
Ни установки пакетов, ни реального provider для этих команд не требуется. Команды из D:\Pet-projects\green-api-chat:

```powershell
npm run test:integration -- conversation-selection.spec.ts
npm run test:query -- conversation-selection.spec.ts
npm run test:e2e -- conversation-selection.spec.ts chat-workspace.spec.ts
npm run test:e2e -- recipient-search-ui.spec.ts chat-list-ui.spec.ts
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
```

Тесты не требуют настоящих токенов; существующие fixtures получают только
вымышленные данные. Red записывается для каждого целевого нового поведения
до соответствующего кода; отсутствие файла/import failure не считается Red.
После Refactor один итоговый набор покрывает затронутые сценарии. Для согласованного
ревью helper входа/session/поиска и параллельной018 выполнены полные
`npm run test:integration`, `npm run test:query` и `npm run test:e2e`;
результаты и причины повторов после ошибок записаны в verification.

Ревью пользователя на готовой версии025: существующие A/B; подтверждённый
поиск→«Написать»; повтор того же chatId; мобильное «Чаты» → повторное открытие → закрытие;
resize 320→1280, tab/focus и выход. Проверить отсутствие SendMessage от открытия,
без дублей списка и без ложного пустого успеха до получения истории. 018 отдельно подключила свежую историю в консоль через этот слот.
Представление истории019 и форма021 до своей реализации остаются NotRunExternal.

Документы проверяются установленным Prettier с --ignore-path NUL на точном
списке файлов, так как проектный ignore исключает docs/specs. Это проверка
формата, не тест работающего приложения. Git/staging/commit не выполняются.
