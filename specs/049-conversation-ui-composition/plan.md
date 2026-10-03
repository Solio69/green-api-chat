# Implementation Plan: композиция UI переписки 049

**Spec**: [spec.md](spec.md)
**Дата**: 2026-10-04
**Согласование spec.md**: Пользователь поручил полный цикл 030–055 без повторного согласования в согласованном объёме.
**Разрешение на реализацию**: Пользователь разрешил самостоятельные полный Spec Kit, код, ревью, commit/push в `refactor`.

## Summary

Перенести UI переписки и связанные provider в `features/conversation/ui`, selection model и две чистые history функции — в назначенные слои. Сохранить все наблюдаемые сценарии. Компонент истории отделит подписку/состояние в hook; `app/page` соберёт sidebar, а conversation adapter передаст selection/unread в chats list через props. Это убирает цикл UI-модулей. Отправка, кеш и polling не переписываются.

## Considered Options

| Вариант | Преимущества | Ограничения/риски | Решение |
| --- | --- | --- | --- |
| Точечный перенос по карте + один оправданный hook | Сохраняет поведение и даёт reviewable diff | 80+ путей, нужна полная регрессия | Выбран |
| Полная перепись UI/кеша/отправки | Быстро убирает все старые `lib` пути | Смешивает поведение с переносом, делает Red/регрессии ненадёжными | Отклонён |
| Только JSX без provider и selection | Меньший diff | Сохраняет глобальные связи и нарушает FR-001/008 | Отклонён |

## Technical Context

Next 16.3.7, React 19.3.0, TypeScript 5.9.3, TanStack Query 5.104.0, Vitest/RTL и Playwright из lockfile. Нынешний один Query cache и client providers сохраняются. Нет зависимостей, миграций, реальных сетевых запросов или новой инфраструктуры. Исходный набор и точные пути — [inventory](inventory.md), текущее поведение — [contract](contracts/conversation-ui.md).

## Constitution Check

- C1 PASS: направление/границы и самостоятельный полный цикл согласованы; новое поведение не выбирается.
- C2 PASS: 049 ограничена UI composition, provider и двумя чистыми моделями; цикл chats UI ↔ conversation UI разрывается через app composition; R09/054 остаются отдельными.
- C3 PASS: существующее разрешение пользователя на полный цикл распространяется на 049.
- C4 PASS: Git-исключение на самостоятельные commit/push `refactor` дано этим пользователем для этого чата.
- C5/C6 PASS: нет пакетов/БД/реальных реквизитов; явный каталог задачи и сохранение чужих правок.
- C7 PASS: baseline до переноса; чистый refactor без искусственного Red; поведенческие отклонения требуют настоящего Red.
- C8 PASS: только текущие UI и роли, без новых state manager/обобщений.

## Research and Design

[Факты и выбор](research.md), [состояния](data-model.md), [UI contract](contracts/conversation-ui.md), [инвентарь](inventory.md), [порядок запуска](quickstart.md). Дополнительный HTTP contract не нужен: route и ответы 049 не меняет.

## Project Structure

Полный пофайловый перечень 79 путей карты 035 с целями — [inventory.md](inventory.md). Семь физических UI provider файлов (`src/components/MessageSendProvider/*`, `src/components/NotificationProvider/*`) переносятся в `src/features/conversation/ui/<same name>/`; физическое завершение отмечается в карте 035. `src/features/conversation/ui/index.ts`, `selection/model/index.ts`, `history/model/index.ts`, `ui/ChatHistoryPanel/use-chat-history-panel.ts` и `ui/ConversationChatListPanel/` добавляются. `src/features/chats/ui/ChatListPanel/ChatListPanel.tsx`, `ChatList/ChatList.tsx`, `ChatListItem/ChatListItem.tsx` получают структурный UI event contract из нового `src/features/chats/ui/types.ts`; selection/unread hooks удаляются из chats/ui. `src/components/ChatWorkspace/ChatWorkspace.tsx` получает `sidebar: ReactNode`, а `src/app/page.tsx` собирает `ChatSidebar` и `ConversationChatListPanel`. `src/app/page.tsx` обновляет feature imports; `src/app/layout.tsx` трогается только при необходимости. Прямые потребители старых путей в `src/features/chats/ui`, `src/components`, `src/lib` и тестах получают новые импорты. `specs/035-feature-module-boundaries/ownership-map.csv` уточняет фактический срок provider. `QueryProvider` и `SubmitButton` остаются до 054.

## Tasks and Dependencies

T001 инвентарь/baseline → T002 read-only анализ → T003 регрессия состояния истории на текущем коде → T004 перенос model/provider/UI и импортов → T005 Green/Refactor и граф → T006 полная проверка/post-analysis/review → T007 commit/push/CI/roadmap. При выявленном изменении бизнес-логики перед T004 добавляется тест и поведенческий Red; без него изменение откладывается. Подробные пути/команды — [tasks.md](tasks.md).

## Verification

Baseline и целевые группы приведены в [quickstart](quickstart.md), полный набор после изменений — typecheck/lint/styles/format, Vitest, integration, Query и production E2E. Проверяются send/IME/unknown, selection, late result, scroll/focus/mobile, статусы и безопасный текст. `rg` подтверждает отсутствие старых UI импортов, граф — отсутствие server runtime в client. Ошибка окружения не является поведенческим Red; любые непрошедшие обязательные проверки оставляют задачу незавершённой.

## Post-design Constitution Check

C1–C8 PASS по тем же основаниям после выбора минимального структурного переноса; технический анализ отдельно проверит карту, покрытие и циклы до кода.

## Complexity Tracking

Число файлов диктуется уже согласованной картой 035. Новых зависимостей нет; history hook отделяет подписку/оркестрацию от JSX, а один UI-адаптер устраняет фактический цикл `chats/ui ↔ conversation/ui` без изменения поведения.
