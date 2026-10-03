# Анализ 049 до реализации

Дата: 2026-10-04. Read-only проход включил spec/checklist/research/plan/data-model/contract/inventory/quickstart/tasks, карту 035, 79 исходных путей 049, семь provider-файлов и конституцию. 97 путей, SHA-256 до/после `3375353c8056e26e899b80328a6f3c01a4bf20082698b2d3db9f9cb06b5e9f4a`, unchanged=true.

## Findings

- HIGH-01, dependency direction, `plan.md` / `src/features/chats/ui/ChatListPanel/ChatListPanel.tsx` / `src/components/ChatWorkspace/ChatWorkspace.tsx`: простой перенос оставит `chats/ui → conversation/ui` через selection и `conversation/ui → chats/ui` через ChatSidebar. При barrel imports возможен runtime-модульный цикл; целевой feature DAG нарушен. Рекомендация: `ChatListPanel` принимает selection/unread как props; UI-адаптер в conversation получает их и рендерит chats list; `app/page` собирает ChatSidebar и передаёт sidebar в ChatWorkspace как ReactNode. В плане явно указать новые пути, контракт и проверки.
- MEDIUM-02, `normalize-history.ts`: type-only импорт server credentials остаётся после переноса файла в чистый `history/model`. Рекомендация: локальный структурный credential type без server import, эквивалентный текущему, с регрессией filtering.
- LOW-03, `inventory.md`: дополнительные семь provider файлов перечислены по группам, но требование плана о полном пофайловом перечне лучше выполнить таблицей с точными путями/целями. Уточнить inventory до кода.

## Покрытие и принципы

FR-001–008 и SC-001–003 привязаны к T001–T007: 11/11, задач без связи с приёмкой 0. Существенных дублей требований 0. C1/C3/C4/C5/C6/C7/C8 PASS; C2 и целевой DAG требуют устранения HIGH-01 в техплане. Baseline и все проверки реализации NotRun; подтверждение hash не является подтверждением поведения. Технические исправления вносятся после этого read-only прохода, затем анализ повторяется; согласованное пользовательское поведение не меняется.

## Повторный read-only анализ после технических исправлений

Изменения сделаны отдельно от первого прохода: spec/plan/research/contract/tasks/quickstart/inventory теперь явно задают app composition sidebar, `ConversationChatListPanel` adapter и props `ChatListPanel`, разрывая UI-цикл; чистый `history/model` использует структурный credential type; семь provider путей перечислены точно. Повторно прочитаны 98 путей, SHA-256 до/после `dd790541fb4b74d4a643a13a830707b9dff3a7a682db07c90c18ad03b47ef7ae`, unchanged=true. FR 8/8, SC 3/3, tasks 7, coverage 11/11; задач без связи 0, открытых CRITICAL/HIGH/MEDIUM/LOW 0, существенных неоднозначностей и дублей 0. C1–C8 PASS: границы разрешённой задачи, односторонний граф, сохранение данных, TDD-гейт для возможного изменения поведения, отсутствие пакетов/БД и честный статус проверок соблюдены. Baseline и код ещё NotRun; результаты реализации фиксируются отдельно в verification.md.

## Read-only анализ после реализации

Проверены 131 путь итогового комплекта/изменённого кода/тестов, карты 035 и C1–C8; SHA-256 до/после `67b52007e63fb0e976b10a825e3ac0beb2ecba7d8c83e225974e66b8ff813e20`, unchanged=true. Исходные 79 строк 049 и семь provider строк карты дают 86 физически перенесённых назначений (три `app` пути остаются на месте). В `src/components` остаются только пять файлов QueryProvider и SubmitButton. Старых UI/selection/history импортов нет; `chats/ui` не импортирует conversation; все относительные SCSS `@use` разрешаются. Graph checker: 30 client roots, 261 TS/TSX, server runtime reachable=false. FR 8/8, SC 3/3, T001–T007, coverage 11/11; C1–C8 PASS, открытых findings 0. Текущие `lib` UI hooks и QueryProvider — известные переходные пути до 054, не представлены как завершённая миграция всего проекта. Точные локальные тесты — в verification.md.
