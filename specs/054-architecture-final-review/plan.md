# Implementation Plan: завершение переноса и архитектурное ревью 054

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Разрешение**: пользователь поручил полный цикл 030–055 и commit/push в `refactor` без повторного согласования.

## Summary

По [карте 69 файлов](migration-map.json) перенести остатки `src/lib`/`src/components` в feature/shared/server, переписать все импорты `src`, `tests`, fixture и конфигураций, удалить старые пути после проверки потребителей. Разделить feature-specific QueryProvider от нейтрального Query context, устранить два найденных цикла и чистые model→server зависимости. Закрепить ключевые границы ESLint и проверить допустимый/запрещённый импорт. Production поведение не меняется.

## Варианты и выбор

| Вариант | Плюсы | Ограничения | Выбор |
| --- | --- | --- | --- |
| Оставить совместимые `src/lib`/`src/components` входы | Меньший diff | Нарушает FR-003; зависимости остаются скрытыми | Нет |
| Механически перенести 69 файлов и не трогать граф | Быстрый перенос | Циклы и inversion сохраняются, границы не доказаны | Нет |
| Перенос + адресное разделение владельцев + lint guard | Соответствует карте и фактическим ролям | Больше затронутых импортов; нужна полная регрессия | Выбран |

## Technical Context and C1–C8

Next 16, React 19, TypeScript 5.9, ESLint 9 flat config, Vitest/RTL и Playwright уже установлены. Никаких новых пакетов и продуктовых данных. C1–C3 PASS: согласованная функциональная архитектура и разрешение полного цикла. C4 PASS: exact staging, commit/push лишь `refactor`. C5–C6 PASS: нет установок или реальных реквизитов. C7 PASS: структурный refactor опирается на baseline 053 и полную регрессию; для lint правила отдельно Red/Green на нарушающем/допустимом примере, новой бизнес-логики нет. C8 PASS: перенос следует владельцам и не вводит абстракции сверх необходимого нейтрального Query context. После design C1–C8 PASS.

## Research and Design

[Research](research.md), [data model](data-model.md), [architecture contract](contracts/architecture-boundaries.md), [quickstart](quickstart.md), [inventory](inventory.md), [migration map](migration-map.json). `server-only` как новая зависимость не вводится; применимость уже имеющихся средств Next/ESLint описана в research. Type-only ребро тоже учитывается при проверке файлового цикла и публичного entry.

## Project Structure

- 69 source files: точные `source → target` в `migration-map.json`; старые каталоги после переноса не содержат source files.
- `src/features/conversation/ui/QueryProvider/*`: feature composition с прежним проп-контрактом; `src/shared/query/ui/*`: новый нейтральный `QuerySessionProvider`/hook. `src/features/conversation/ui/index.ts` экспортирует facade.
- `src/shared/kernel/api/instance-credentials.ts` и чистый identifier helper: общие безопасные типы/правила для model и server; убрать циклы `get-state↔transport` и `chats/server↔get-chats` без изменения функций.
- Точечные изменения `src/features/chats/server/types.ts`, `src/features/conversation/{notifications,messages,sending,history}/**`, `src/server/session/**`: убрать неверное направление импорта и разделить смешанные контракты где есть фактическая необходимость.
- `src/**/*`, `tests/**/*`, `tests/fixtures/query-app/**/*`: заменить импорты старых путей, сохранить Next reserved entry и UI поведение; CSS-модули переезжают вместе с компонентом.
- `eslint.config.mjs`: ограничения для shared/kernel/query/ui, чистых model и client UI; существующее правило `../` остаётся.
- `specs/054-*`, `docs/architecture.md`, `docs/CODING_RULES.md` и roadmap: итоговая карта и текущие инструкции, историческая CSV 035 неизменна.

## Dependencies and Verification

053 Green → inventory/map → полный комплект/read-only analyze → перенос и import rewrite → разделение контекста/типов/циклов → lint guard и положительный/отрицательный oracle → typecheck, ESLint, styles, format, Vitest 470+, Query 37, E2E 112 → graph/old-path audit → code review/commit/push/CI → verification/docs/roadmap commit/push/CI. Числа тестов не должны уменьшаться без поимённой карты. Нового поведения нет, искусственного Red для перемещения файлов не требуется; lint negative oracle обязателен для нового правила.

## Complexity Tracking

Один нейтральный context нужен, потому что feature-specific session creation нельзя импортировать из shared. Остальные перемещения из существующей карты; новый framework или универсальный DI-контейнер не добавляется.
