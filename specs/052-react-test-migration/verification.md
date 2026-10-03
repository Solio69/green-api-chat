# Verification 052 — React-проверки в Testing Library

## Результат и эквивалентность

До удаления дублей прошли старые 46/46 Playwright Query и новые 9/9 RTL. [Поимённая карта](scenario-map.json) связывает 45 ID B028 и новый `N052-Q-0001` с текущими путями; переименование заголовка `B028-Q-0007` указано явно. После удаления discovery показал `expected=46`, `browser=37`, `rtl=9`, `missing_browser=0`, `extra_browser=0`, `missing_rtl=0`, `extra_rtl=0`.

Четыре новых RTL набора проверяют настоящие QueryProvider, ConversationSelectionProvider, QueryClient, useChats/useChatHistory и отображаемые компоненты. Два history consumers делят один запрос; размонтирование первого не сбрасывает второго. Проверены A→B→A и поздние ответы, dedup pending refresh, закрытие сеанса и новый scope, пустая загрузка, overlay после empty/error, выбор и сохранение draft при повторном открытии. Тест редактора использует настоящий MessageComposer с контролируемыми send/notification boundary; проверка Strict Mode replay из 030 сохранена и входит в общий Vitest.

Удалены девять старых браузерных тестов, единственный неиспользуемый `SessionOverlayProbe`, его query-app branch и три осиротевшие fixture-константы. Остальные 37 сценариев оставлены в Playwright с индивидуальными причинами в карте: они проверяют Next/HTTP, браузерную навигацию и console, Web Locks, две вкладки, реальные composition/scroll/геометрию или live ACK. Их дальнейшая инвентаризация — задача 053. Продуктовый код, команды, CI конфигурация и зависимости не менялись: действующее discovery автоматически подхватило новые файлы.

## Локальная проверка

| Команда / контроль | Результат |
| --- | --- |
| `npm run typecheck` | Passed: app, Vitest, query test app |
| `npm run lint`, `npm run lint:styles`, `npm run format:check` | Passed после последней правки |
| `npm test` | Passed: 59 файлов, 470 тестов; последний изменённый selection suite отдельно 3/3 |
| `npm run test:query` | Passed: исходный 46/46 до удаления; итоговый 37/37 |
| `npm run test:e2e` | Passed: 112/112, включая production build |
| Трассировка ID | 46/46, девять RTL и 37 browser без missing/extra |
| Отрицательный oracle | Намеренно неверный empty-state упал 1/1; файл восстановлен, целевой тест 1/1 Green |
| `git diff --cached --check`, staged review | Passed: 21 собственный файл, нет изменений `src`, lockfile, product routes или секретов |

Локальные логи не содержат новых React act/unhandled диагностик. [Read-only анализ](analysis.md) повторён после реализации с проверкой неизменности файлов. Проверки настоящего браузера не заменены jsdom-эмуляцией.

## GitHub CI

Кодовый коммит [`c214925dc53857b757675e6acfc914c0478d396a`](https://github.com/Solio69/green-api-chat/commit/c214925dc53857b757675e6acfc914c0478d396a) отправлен в `origin/refactor`. [Run 37160908926](https://github.com/Solio69/green-api-chat/actions/runs/37160908926) завершился `success`: `quality=success`, `browser=success`; сохранены артефакты `quality-1` и `browser-1`. Документационный коммит проверяется следующим CI run.
