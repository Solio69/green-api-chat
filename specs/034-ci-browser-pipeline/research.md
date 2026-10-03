# Исследование 034: браузерный CI

Дата: 2026-10-03. 033 завершена: GitHub run 37118444083 на итоговом
faa2225 success, artifact есть. Playwright 1.63.0 уже закреплён lockfile.
Локальный Chromium установлен ранее, новых локальных пакетов не требуется.

## Решения и варианты

| Вопрос | Вариант | Польза | Цена и выбор |
| --- | --- | --- | --- |
| Browser job | Отдельная job в quality.yml | Общий status требует success обеих jobs; browser failure виден отдельно | Вторая npm ci, оправданная изоляцией и параллельным запуском |
| Browser рядом с quality | Один длинный job | Одна npm ci | Медленный типовой feedback и смешанные отчёты; отклонён |
| Установка Chromium | npx playwright install --with-deps chromium | Совпадает с закреплённой версией Playwright и ставит системные библиотеки | Расход CI-времени, нужен только на runner |
| Отчёты query/E2E | Разные outputDir и HTML-каталоги | Второй набор не удаляет trace первого | Две папки artifact; выбран |
| Сбой фокуса | Ждать callback ResizeObserver в тесте | Не меняет код | Скрыл бы установленную нестабильность; отклонён |
| Сбой фокуса | ResizeObserver + window resize event | Восстановление после изменения viewport, даже если observer callback задержан; сохраняет observer для изменения размеров панелей | Второй источник событий; idempotent focus и cleanup обязательны |
| Mock поставщика | Предзагрузка fake-green-api для Next webServer + fail-fast для иных GREEN-API origin | Фиктивные ответы, явная ошибка при изменении host | Не распространяется на внешний аватар; browser tests уже контролируют картинки |

E2E config собирает production-приложение один раз внутри webServer, порт 3101,
и загружает fixture через NODE_OPTIONS --import. Query config отдельно собирает
tests/fixtures/query-app и стартует порт 3102. Оба набора sequential внутри
одной browser job; корень .next и query .next отдельны. Повторная внешняя
npm run build перед E2E не нужна.

Query вывод: test-results/query и test-results/query-report;
E2E: test-results/e2e и playwright-report. Browser log:
test-results/browser. Ни один Playwright outputDir не является их родителем.
Upload обоих каталогов выполняется даже после тестового failure, кроме cancel;
if-no-files-found:error. Секреты и реальные реквизиты не передаются.

DEFECT-01: baseline 028 содержал 108/109 E2E и повтор 2/3; старая
проверка фокуса B028-E-0026 нестабильна. На текущем коде 10 повторов
11:05 UTC Passed, поэтому этот повтор не считается исправлением или Red.
Новый тест задержанной доставки ResizeObserver дал детерминированный Red
после точного воспроизведения mobile back → desktop → mobile, затем Green.
Первый тестовый набросок не возвращал мобильную панель к списку и был
отклонён как неверный Red. Исходный тест остаётся.
Восстановление фокуса при уходе за пределы workspace не должно воровать
фокус: существующие E2E сценарии это проверяют.

Для SC-002 временный runner-only browser test с ожидаемым failure и trace
публикуется в refactor отдельным commit после первого зелёного run, затем
удаляется отдельным commit. Финальный head снова должен быть зелёным.
Это конфигурационный negative control, не оставляемый в проекте.

## Источники

- [Playwright CI](https://playwright.dev/docs/ci-intro) — npm ci, browser with deps, отчет artifact.
- [Playwright CI detail](https://playwright.dev/docs/ci) — ресурсные ограничения CI и отчёты.
- [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — доставка callback после изменения размера элемента.
- [window resize](https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event) — событие изменения viewport.
- Локальные playwright.config.ts, playwright.query.config.ts,
  tests/e2e/fixtures/fake-green-api.ts и baseline 028.
