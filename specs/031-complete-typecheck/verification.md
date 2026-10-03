# Проверки и ревью 031

Дата: 2026-10-03. Выполнено. Меняются конфигурации и документация; runtime и зависимости сохранены.

## Фактические результаты

| Проверка | Результат |
| --- | --- |
| Общий npm run typecheck | Passed, все три проекта |
| Чистая генерация типов, npm run typecheck | Passed, 10:05:28–10:05:37 UTC |
| Ошибка в новом src/typecheck-031-probe.ts | Ожидаемый Failed, exit 2, TS2322 |
| Ошибка в новом tests/unit/typecheck-031-probe.ts | Ожидаемый Failed, exit 2, TS2322 |
| Ошибка в новом tests/component/typecheck-031-probe.tsx | Ожидаемый Failed, exit 2, TS2322 |
| Ошибка в новом query-app/components/typecheck-031-probe.tsx | Ожидаемый Failed, exit 2, TS2322 |
| Ошибка в новом tests/query/typecheck-031-probe.ts | Ожидаемый Failed, exit 2, TS2322 |
| DOM matcher в Playwright | Ожидаемый Failed, exit 2, TS2339 для toBeInTheDocument |
| Полнота через TypeScript API | 314/314 TS/TSX/MTS исходников в программах, missing=[] |
| npm test | Passed, 15/15 |
| npm run lint | Passed |
| npm run lint:styles | Passed |
| npm run format:check | Passed |
| git diff --check | Passed |

Все негативные сценарии выполняли общий npm run typecheck и завершились
из-за ожидаемой ошибки типов в указанном файле. Probes удалены в finally.
Это контроль конфигурации, не TDD новой бизнес-логики.

## Чистое состояние

До запуска отсутствовали root/query next-env.d.ts, root .next/types и
.next/dev/types, query .next/types; существующие файлы сохранены в игнорируемом
test-results/031-type-backup с проверкой абсолютных путей внутри репозитория.
Общая команда восстановила next-env.d.ts и routes.d.ts обоих приложений,
затем проверила все области. Production build и старый incremental cache не нужны.
Старые generated types не импортируются из резервной папки.

## Соответствие и ревью

FR-001/002: явные области трёх tsconfig; 314 исходных файлов покрыты.
Root includes общие test helpers, исключает Vitest/query области;
отдельные проекты вызываются общей командой. Сборочные артефакты, reports
и зависимости не включаются в корневые исходники.
FR-003: npm && останавливает общую команду при ошибке любого проекта.
FR-004: strict остаётся true; ambient types node отделены от vite/client;
matcher isolation проверена отрицательным примером. any/suppressions не добавлялись.
FR-005: новые независимые файлы во всех областях обнаруживаются без импорта.
FR-006/SC-001–003: README описывает общую команду; clean и negative checks выполнены.

Предкоммитный рефакторинг: TS/TSX patterns сгруппированы по областям; повторной
системы конфигурации или composite references не добавлено.
Просмотрены package scripts, все изменённые tsconfig, README и полный комплект.
Lockfile не меняется: scripts не затрагивают граф зависимостей.
Продуктовые TS/TSX не изменялись; Next typegen не внёс сторонних config-правок.
Наборы browser/integration в этой задаче NotRun: runtime не затронут.
Известный DEFECT-01 baseline остаётся в плане browser CI.

## Завершение

Коммит: chore: check types across all application and test projects.
Точные файлы коммитятся и отправляются после анализа по поручению пользователя.
Следующая задача: 032, полезные правила async-кода с информацией о типах.
