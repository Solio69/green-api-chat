# Implementation Plan: достоверные браузерные и сквозные проверки 053

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Разрешение**: пользователь поручил полный цикл 030–055 и commit/push в `refactor` без повторного согласования.

## Summary

Сохранить все 149 браузерных сценариев и их точные контракты, убрать проверки строк SVG и селекторы разметки там, где наблюдаемое поведение можно проверить доступным именем/ролью. Геометрию, CSS, отсутствие опасной строки в HTML и доступность декоративного SVG сохранить как намеренные browser assertions. Проверить состав по 149 ID, оба Playwright suite локально и в CI с отчётами.

## Варианты и выбор

| Вариант | Преимущество | Риск | Выбор |
| --- | --- | --- | --- |
| Переписать все browser assertions на роли | Единый стиль | Теряются CSS, геометрия и browser API контракты | Нет |
| Оставить тесты неизменными | Нулевая миграция | SVG serialization и generic DOM count ломаются от безопасной разметки | Нет |
| Менять только хрупкие поведенческие проверки | Сохраняет UI/браузерные гарантии, устойчив к path/разметке | Нужен поимённый аудит исключений | Выбран |

## Technical Context and C1–C8

Next 16, React 19, TypeScript, Playwright 1.63, Vitest/RTL уже установлены. `playwright.config.ts` запускает production Next с fake GREEN-API; Query fixture работает отдельно. `retries: 0`, trace failure, E2E screenshot failure, HTML reports. Никаких новых пакетов/маршрутов/продуктового поведения. C1–C3 PASS: решение о границе инструментов уже согласовано, полное поручение и два этапа 053 сохранены. C4 PASS: узкое разрешение пользователя commit/push только `refactor`, предварительная проверка exact staging. C5–C6 PASS: внешних установок, реальных реквизитов или данных нет. C7 PASS: baseline и ID parity для чистого тестового рефакторинга, полные регрессии и CI; новый behavior/TDD не требуется. C8 PASS: три точечных тестовых файла, карта и аудит без новой тестовой платформы. После проектирования C1–C8 PASS.

## Research and Design

[Research](research.md), [data model](data-model.md), [browser contract](contracts/browser-test-contracts.md), [quickstart](quickstart.md), [inventory](inventory.md), [browser map](browser-map.json), [selector audit](selector-audit.md). Настоящий браузер обязателен для Web Locks, focus/scroll/layout и маршрутов; jsdom не подменяет эти гарантии.

## Project Structure

- `tests/e2e/login-form.spec.ts`: убрать `innerHTML` SVG path equality; сохранить видимость/aria-hidden и геометрию кнопки, проверять действие через role/name/title/input type/value.
- `tests/e2e/home.spec.ts`: убрать generic `input` count; два обязательных поля уже проверяются по label и required.
- `tests/e2e/recipient-search.spec.ts`: заменить `main` CSS selector на `getByRole('main')` в сценарии защищённого home.
- `tests/e2e/account-profile.spec.ts`: единственное поле поиска проверять через роль `textbox`, сохраняя другие SVG/image/HTML и layout проверки.
- `specs/053-browser-test-contracts/{inventory,browser-map,selector-audit,plan,research,data-model,contracts/browser-test-contracts,quickstart,tasks,analysis,verification}.md/json`: полная трассировка/проверка.
- `docs/refactoring-roadmap.md`: статус только после проверок.
- CI/config/production/lockfile без изменений: команды и артефакты уже обеспечены 034; FR-007 подтверждается проверкой конфигурации и удалённым CI, а не косметической правкой YAML.

## Dependencies and Verification

052 → discovery/inventory → полный комплект → read-only analyze с hash snapshot → тестовый рефакторинг → typecheck/lint/styles/format, Vitest, Query 37 и E2E 112 → ID parity/selector audit → предкоммитное ревью → code commit/push/CI → verification/roadmap commit/push/CI. Browser suites выполняются последовательно. Ошибка браузера или незапущенный suite — Blocked/NotRun, а не Passed. Изменение продукта не планируется, поэтому требуется исходный Green и неизменный наблюдаемый контракт, не искусственный Red. Отдельный негативный oracle у 034 уже подтвердил падение CI и публикацию trace/screenshot/artifact; 053 сверит актуальную конфигурацию и live artifact.

## Complexity Tracking

Нет новых абстракций, зависимостей и отклонений. Поимённая карта необходима для доказательства отсутствия потерь после 051/052.
