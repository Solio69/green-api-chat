# Implementation Plan: Vitest и React Testing Library

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03.
**Авторизация**: пользователь уточнил, что разрешён полный цикл с кодом, проверками и самостоятельным локальным commit в refactor; 029 выполняется как первая задача с изменением исполняемых файлов. Повторное разрешение на код/commit не требуется. Установка пакетов регулируется отдельно C5.

## Summary

Добавить Vitest с Node/DOM-проектами, пилотные проверки и проверяемую очистку окружения. Перенос ограничен двумя recipient-label сценариями; браузерные гарантии сохраняются.

## Considered Options

| Решение   | Выбор                                                                                     | Альтернатива и риск                                                             |
| --------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Окружения | Один конфиг, два именованных проекта node и dom                                           | Общий jsdom скрывает Node-зависимость                                           |
| DOM       | jsdom 29.1.1                                                                              | Версия 30 требует обновления Node; happy-dom добавляет другой набор ограничений |
| React     | RTL и user-event, независимые ожидаемые тексты                                            | Snapshot/внутренние классы привязывают тест к разметке                          |
| Очистка   | После теста unmount/таймеры, восстановление mocks/stubs; новый QueryClient на каждый тест | Shared client делает результат зависимым от порядка                             |
| Миграция  | Сначала эквивалентный проход, затем удалить прежний recipient-label файл                  | Удаление до подтверждения теряет доказательство покрытия                        |

## Technical Context

Существующий Next.js 16.3.7, React 19.3.0, TypeScript 5.9.3, Node 24.14.1 и npm 11.11.0. Версии восьми новых devDependencies — в [research.md](research.md). Пакеты устанавливает пользователь либо агент после отдельного прямого исключения; никакой скрытой установки через npx.

## Constitution Check

C1 PASS: направление и полный цикл делегированы; технические варианты объяснены. C2 PASS: только 029. C3 PASS: существующая авторизация сохраняется, анализ обязателен перед кодом. C4 PASS с пользовательским исключением для локального commit в refactor; правила Git не меняются. C5 PASS: установка только пользователем или после явного исключения. C6 PASS: синтетические данные и явный feature. C7 PASS: конфигурация проверяется успешными/нарушающими примерами, реальные результаты фиксируются. C8 PASS: без нового runtime и массового переноса.

## Research and Design

[research.md](research.md), [data-model.md](data-model.md), [contracts/test-runtime.md](contracts/test-runtime.md), [quickstart.md](quickstart.md), [migration-map.md](migration-map.md). Clarify отдельно неприменим: неизвестных продуктовых требований нет. Модель описывает тестовые ресурсы, а не БД.

## Project Structure

| Путь                                             | Действие                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| package.json, package-lock.json                  | Версии devDependencies и команды; lockfile только штатной установкой         |
| vitest.config.mts                                | Проекты node и dom с непересекающимися include, alias и React plugin         |
| tsconfig.vitest.json                             | Проверка новых тестов/config/setup без глобальных API Vitest                 |
| tests/setup/timers.ts                            | Сброс fake timers без исполнения оставшихся callback                         |
| tests/setup/node.ts                              | Node afterEach                                                               |
| tests/setup/dom.ts                               | jest-dom matchers, unmount, затем timers                                     |
| tests/support/query-client.ts                    | Новый QueryClient на тест и очистка через onTestFinished                     |
| tests/unit/recipient-label.test.ts               | Два эквивалентных сценария B028-I-0240/I-0241, сверенные с исходным реестром |
| tests/unit/environment.test.ts                   | Контракт Node и восстановления mocks/fetch/env/timers                        |
| tests/component/recipient-search-result.test.tsx | Пользовательское отображение/действие существующего компонента               |
| tests/component/environment.test.tsx             | Очистка DOM/QueryClient и development React                                  |
| tests/integration/recipient-label.spec.ts        | Удалить только после успешной эквивалентной миграции                         |
| README.md                                        | Команды, окружения, ограничения                                              |
| docs/refactoring-roadmap.md                      | Фактический прогресс 029 и ссылки                                            |
| specs/029-vitest-test-foundation/*               | Полный комплект, карта миграции, анализ и verification                       |

Исходники src/, Playwright config и браузерные тесты не меняются. Режимы определяют include/env; Node setup не импортирует RTL или серверные route-модули. DOM-пилот импортирует только клиентский компонент и чистые контракты, глобальных mocks next/headers/iron-session нет.

## Tasks and Dependencies

Полный анализ → исходные пилотные прогоны → конфигурация и тестовые файлы → установка разрешённым способом → Node/DOM по отдельности и вместе → контролируемое нарушение → восстановление и повтор → удаление старых двух сценариев → интеграционная регрессия и целевой E2E → статические проверки → рефакторинг/ревью → итоговый read-only анализ → verification → локальный commit.

Новая бизнес-логика не пишется, искусственный продуктовый TDD не заявляется. Проверка намеренно неверного ожидания должна упасть в assertion, не на импорте. Перенос сохраняет независимые fixtures/ожидания.

## Verification

- Node/DOM проекты запускаются отдельно, вместе, по имени/файлу; watch запускается интерактивно и завершается штатно.
- Пилоты используют @/ и SCSS Modules; development React поддерживает act.
- Инфраструктурные последовательные пары тестов намеренно оставляют DOM, fake timers, mocks/fetch/env и QueryClient, следующий тест проверяет очистку. Такая последовательность ограничена проверкой самого test runtime.
- Unit/DOM результаты сравниваются с исходными контрактами; E2E recipient-search-ui сохраняется.
- Контролируемая подмена '@demo_user' на '@wrong_user' в ожидаемом результате даёт exit 1 и имя сценария; после восстановления набор проходит.
- npm run typecheck, npm run typecheck:tests, npm run lint, npm run lint:styles, npm run format:check; проверка новых docs с --ignore-path NUL.
- Полный integration после удаления пилота; query --list и e2e --list подтверждают отсутствие случайного захвата тестов. Целевой production E2E recipient-search-ui также выполняется.
- Известный DEFECT-01 другого E2E не исправляется и не выдаётся за закрытый. Изменений application code нет; повтор всего query/E2E без дополнительной причины не нужен.

## Post-design Constitution Check

C1–C8 PASS в указанных границах. Если установка недоступна, писать разрешённые файлы можно, но запуск и завершение/commit задачи блокируются до фактических проверок. Не коммитить только спеки как готовую 029.

## Complexity Tracking

Конфигурационные тесты обоснованы FR-004 и SC-002. Восемь devDependencies обеспечивают выбранный стек без UI, coverage provider, MSW и новых runtime-пакетов. Контракт очистки QueryClient нужен до переноса hook-тестов и проверяется уже в пилоте.

Разовое исключение пользователя 2026-10-03: агенту разрешена установка восьми devDependencies по quickstart и завершение проверок/commit. Общие правила проекта не изменяются.

ESM-конфиг имеет расширение .mts, чтобы явно указать формат без изменения package type. eslint.config.mjs включает .mts в действующие группы правил; новые правила не добавляются.

Историческая ссылка recipient-label в specs/028-refactor-test-baseline/test-inventory.md указывает на исходный commit до переноса. Сам реестр и исходные counts не меняются.
