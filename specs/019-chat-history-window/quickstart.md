# Quickstart: история выбранного чата и кеш

**Состояние**: PassedSynthetic, включая совместную приёмку SC-005 после020–024. Результаты и точные команды — [verification](verification.md). Реальный GREEN-API — NotRun.

## Тестовый цикл

Каждому Green предшествует отдельный доказанный Red из tasks.md. Ошибка
окружения не Red. Используются существующие Playwright configs и Chromium;
установку делает пользователь, если среда окажется неполной. Данные фиктивные.

```powershell
npm run test:integration -- tests/integration/message-cache.spec.ts tests/integration/session-chat-facts.spec.ts tests/integration/chat-query.spec.ts
npm run test:query -- tests/query/history-window.spec.ts tests/query/session-chat-overlay.spec.ts
npm run test:e2e -- tests/e2e/history-window.spec.ts
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
node node_modules/prettier/bin/prettier.cjs --check --ignore-path NUL specs/019-chat-history-window
```

После всей серии правок запускать один итоговый набор; расширять только при
новых рисках. format:check охватывает исходники и тесты; отдельная команда
документации с --ignore-path NUL проверяет исключённые specs/docs.
Фактические команды Red/Green/итог и ошибки записать в
verification.md после реализации, без реальной переписки/токенов.

## Приёмка

Выбрать A, получить свежие десять сообщений, переключить B и вернуться A с новым ответом:
merge сохраняет известное без дублей, результат отображается в переписке без отладочных логов.
Контролируемые fixture responses подтверждают A→B→A/close/logout guards,
empty/error retention, unsupported/HTML literal и длинные переносы.
Проверить desktop/mobile макет, back сохраняет выбор, close скрывает history,
scroll вверх не вызывает запросы. Count10 не скрывает >10 накопленных элементов.
Overlay accepted/incoming подтверждается fixtures, пустой/error provider list
не удаляет факт, позже GetChats соединяет строку и сохраняет fallback label.

После внешних features 023/021/024 повторить общий сценарий receiving до конца
history, ранний статус перед accepted, read→late delivered и contradictory
failure; один message и отдельный общий issue. Изолированная проверка 019 также
подтверждает, что useChatHistory публикует returned issue при переходе
failure→история delivered/read, сохраняя положительный статус.
До внешней интеграции SC-005 NotRunExternal,
без объявления всего пласта выполненным. Точные acceptance items в
[checklist](checklists/acceptance.md).

## Переполнение окна

Команда: npm run test:e2e -- tests/e2e/history-scroll.spec.ts.
Пять ширин и высоты 800/480: десять длинных сообщений не увеличивают окно,
верхняя часть скрыта за границей списка, последнее входящее видно внизу.
Проверить неподвижные шапку/форму и ручную прокрутку к началу списка.
Регрессия позиции читателя: npm run test:query -- tests/query/history-window.spec.ts.
Фактические результаты текущего исправления находятся в verification.md;
SC-005 после готовности020–024 имеет статус PassedSynthetic.
