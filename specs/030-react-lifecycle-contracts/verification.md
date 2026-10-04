# Проверки и ревью 030

Дата: 2026-10-03. Результат: выполнено. Поведение src и зависимости не менялись.

## Автоматические проверки

| Команда | Результат | Факт |
| --- | --- | --- |
| npm test | Passed | 15/15, 5 файлов; итоговый запуск 09:50:06–09:50:08 UTC |
| npm run test:component -- tests/component/provider-lifecycle.test.tsx | Passed | 8 новых регрессионных сценариев |
| npm run test:query -- tests/query/chat-query.spec.ts | Passed | 9/9; production build fixture; 09:48:42–09:49:01 UTC |
| npm run typecheck | Passed | typegen и root TypeScript |
| npm run typecheck:tests | Passed | Vitest и новые helper/component файлы |
| npm run lint | Passed | весь применимый ESLint |
| npm run lint:styles | Passed | SCSS |
| npm run format:check | Passed | весь применимый Prettier |

Временное отключение reactStrictMode вызвало ожидаемый Failed exit 1:
получено ['setup'] вместо ['setup', 'cleanup', 'setup'].
Файл восстановлен в finally; итоговый npm test Passed.
Первый вариант harness со StrictMode внутри wrapper также обнаружил отсутствие
replay; это ошибка окружения теста, а не продуктовый дефект и не TDD Red.
Корневая опция RTL исправляет окружение и подтверждается наблюдаемым replay.

## Соответствие требованиям

- FR-001–003: настоящие QueryProvider, NotificationProvider, фабрики и транспорт;
  mock только внешних fetch, acquireBrowserTabLease и Next router.
  Spy createQuerySession вызывает исходную реализацию.
  NotificationNotice и hook-потребитель используют общий контроллер.
  Один lease и receive; заброшенные initializer clients не содержат query-ресурсов.
- FR-004: обычный rerender сохраняет объекты/кеш; scope/key B закрывает A,
  отменяет его запрос, освобождает lease, создаёт независимый кеш и владельца.
- FR-005: окончательный unmount очищает кеш и query observers, отменяет receive,
  убирает owner и таймеры. Поздний валидный receive не пишет кеш и не ACK.
  Поздний lease освобождается без запросов; отказ lease не оставляет ресурсов.
  Исключение одного cleanup не препятствует остальным.
  Проверены таймеры обычного polling и retry.
- FR-006: прежние браузерные assertions сохранены; имя точно указывает
  production wrapper remount и rerender.
- FR-007: продуктовых дефектов в проверенных lifecycle-контрактах не выявлено;
  ожидания не ослаблялись. Новая бизнес-логика не добавлялась, TDD не заявляется.
- SC-001–003: подтверждены перечисленными сценариями и отрицательным контролем.

## Предкоммитный рефакторинг и ревью

Проверены все новые тесты/helper, diff существующих тестов и комплект документов.
Helper управляет внешними ответами, не воспроизводит алгоритм контроллера.
Late delivery типизирована NotificationDelivery и проходит реальную валидацию:
невалидная фикстура не может сделать этот сценарий ложно зелёным.
Освобождение query observers проверяется на захваченных объектах до очистки кеша.
После assertions предусмотрен teardown для аварийно завершившегося теста.
Тесты не зависят от реальной сети, аккаунтов, sleep, очередности файлов или retry.
Типовые данные только фиктивные. Лишних зависимостей/продуктовых правок нет.

## Ограничения и дальнейшая работа

Полный integration, query и E2E здесь не повторялись: src не менялся; затронутый
query-файл выполнен целиком. Реальное Web Locks исключение остаётся за браузером.
Известный baseline DEFECT-01 с фокусом не затронут; нужен до зелёного browser CI.
Следующая задача 031 объединяет typecheck приложения, Vitest и query fixture.

Коммит: chore: verify real React provider lifecycle.
Commit/push выполняются после финального анализа и подтверждаются Git SHA.
