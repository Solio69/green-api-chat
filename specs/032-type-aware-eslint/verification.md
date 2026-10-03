# Проверки и ревью 032

Дата: 2026-10-03. Выполнено.

## Результаты

| Проверка | Фактический результат |
| --- | --- |
| Реальный ESLint config: invalid/valid/explicit void | 40/40 контролей Passed |
| npm run lint | Passed, типизированные правила и JS-конфиги |
| npm run typecheck | Passed, три проекта; повторный последовательный итог после browser build |
| npm run lint:styles | Passed |
| npm run format:check | Passed |
| npm test | Passed, 15/15 |
| npm run test:integration | Passed, 351/351, 10:21:34–10:22:04 UTC |
| npm run test:query | Passed, 45/45, 10:21:17–10:23:51 UTC |
| Целевой npm run test:e2e из quickstart | Passed, 44/44, 10:24:21–10:24:57 UTC |
| git diff --check | Passed |

Query и E2E исполнялись последовательно с production сборками.
Полный E2E в этой задаче не заявляется: проверены восемь затронутых файлов,
перечисленных в quickstart. Известный baseline DEFECT-01 focus остаётся для 034.
Retry в тестах не добавлялся.

## Доказательство правил

По девять контролей в src, tests/unit, tests/component и query fixture:
потерянный Promise, await, return, catch, явный void обработанной операции,
Promise в if, async forEach, async JSX handler и синхронный JSX adapter.
Дополнительно проверены MTS config (floating Promise обнаружен через lintText)
и три реальных JS-config. Всего 40/40, ни одна ошибка parser/project не
засчитана за работающий ruleId. Временные файлы удалены в finally.

Ожидаемые ruleId: @typescript-eslint/no-floating-promises и
@typescript-eslint/no-misused-promises. Проверка JSX сохранена; blanket disable нет.
ignoreVoid:true описывает намеренный detached вызов, не обработку ошибки.
Это контроль конфигурации, не Red новой бизнес-логики.

## Соответствие и предкоммитное ревью

FR-001–003: все три TypeScript-проекта подключены к TS/TSX/MTS ESLint;
JS сохраняет прежние правила. Установки и граф зависимостей не менялись.
FR-004/005: просмотрены все 18 исходных диагностических мест и уже имеющиеся
detached операции; владельцы отказов описаны в research.md.
Изменены 12 файлов с границами вызова. Try/catch/finally, await, payload,
порядок close → navigation и политика повторов остались прежними.
React handlers явно возвращают void; вызываемая async операция стартует
синхронно до своего первого await, поэтому preventDefault сохраняет момент вызова.

QueryCache.onError проверен по установленному query-core/src/query.ts:
callback вызывается без await. Замена игнорируемого return на явный void
не меняет порядок lifecycle. QueryObserver.refetch без throwOnError сохраняет
ошибку в query state; формы и send/controller уже преобразуют штатные ошибки.
Пустых catch для подавления ошибок не добавлено.
Предкоммитное ревью охватило каждый diff; precommit refactor ограничен явными
event adapters и порядком форматирования, без отдельного универсального helper.

Регрессия проверила success/error/pending/retry форм, потерю результата send,
смену подключения, завершение сессии, передачу Web Lock, остановку после unmount.
FR-006/SC-001–003: CODE_STYLE соответствует реальному config; локальные проверки
и фактическая регрессия завершены. Не заявляется безопасность произвольных
исключений программирования: при смене async-контракта callers пересматриваются.

## Завершение

Коммит: refactor: enforce typed async contracts.
После финального read-only анализа точные файлы коммитятся и отправляются
по разрешению пользователя. Следующая задача 033 — quality CI,
затем 034 — browser CI и известный дефект фокуса.
