# Implementation Plan: границы модулей 035

Spec: [spec.md](spec.md). Дата: 2026-10-03. Объём — документация и
верифицируемая карта, без перемещения исходников.

## Результат

Создать [архитектурную карту](../../docs/architecture.md), CSV-инвентарь
`ownership-map.csv` со строкой для каждого tracked файла src и tests,
контракт направлений импортов и матрицу переходов 036–049. Карта
сопоставляет текущий путь с владельцем, целевой областью, слоем,
задачей переноса или причиной сохранения. Тестовые файлы получают
владельца сценария и целевую задачу 050–053; runner fixtures — 050.

## Технический контекст

Next.js App Router, React Client Components, TanStack Query,
TypeScript, SCSS Modules. Серверные маршруты остаются в `src/app`;
тонкая route composition вызывает feature/server функции. Предлагаемое
дерево: `src/features/{auth,account,recipients,chats,conversation}`,
`src/shared/{kernel,ui,query}`, `src/server/{http,green-api,session}`.
Подобласти conversation: selection, history, messages, sending,
notifications, unread. Конкретное имя `shared/query` не делает session
доменом; фабрика не импортирует chats. Разделение `model`,
`application`, `ui`, `server` проводится только при реальной роли.

## Изменяемые файлы

- `specs/035-feature-module-boundaries/{spec,checklists,research,plan,data-model,quickstart,tasks,analysis,verification}.md`
- `specs/035-feature-module-boundaries/contracts/dependency-boundaries.md`
- `specs/035-feature-module-boundaries/ownership-map.csv`
- `docs/architecture.md`, `docs/CODING_RULES.md`, `docs/refactoring-roadmap.md`

`CODING_RULES` меняется только в части размещения feature-local
компонентов и публичных импортов, которую потребовала утверждённая
архитектура. Правила констант, форматирования и поведения не меняются.
Старые импорты допустимы только как переходные до конкретной задачи
036–049 и перечислены в контракте. 054 проверит их удаление.

## Порядок и проверки

Подготовить полный комплект → read-only анализ консистентности и
трассировки → составить CSV по tracked путям → вручную проверить
пограничные назначения и целевой DAG → описать правила и переходы →
проверить точное равенство множества путей CSV и `git ls-files src tests`,
отсутствие незаполненных владельцев/задач, ссылки, format/check → review,
commit/push `refactor` и фактический статус CI.

Никаких product-тестов для документального изменения: текущий CI
выполняется на итоговом commit. Запрещено утверждать, что текущий граф
уже не содержит циклов; SC-002 относится к целевой карте.

## Конституция C1–C8

C1 PASS: варианты и риски в research. C2 PASS: 035 только карта.
C3 PASS: полная подготовка и анализ до результата. C4 PASS: рефакторинг
в разрешённой refactor. C5 PASS: без зависимостей и установок.
C6 PASS: без реальных реквизитов и пользовательских данных. C7 PASS:
проверка всех tracked путей и целевого DAG. C8 PASS: отдельный
документ правил, без преждевременных кодовых перемещений.
