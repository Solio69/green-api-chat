# Tasks: Счётчики новых сообщений

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Статус**: Completed; реализация, TDD, preview, ревью и итоговые проверки выполнены. Авторизация пользователя сохранена.

- [x] T001 [US1] Сохранить tests/unread/constants.ts и tests/integration/unread-notifications.spec.ts; запустить applyNotification-тест и подтвердить поведенческий Red.
- [x] T002 [US1] После T001 реализовать src/lib/unread/unread-cache.ts/constants.ts, memory defaults в src/lib/query/create-query-session.ts, incoming в src/lib/notifications/apply-notification.ts; дедупликация и lifecycle.
- [x] T003 [US2] После T002 реализовать src/lib/unread/use-conversation-read-state.ts/use-unread-counts.ts; подключить paneRef в src/components/ChatWorkspace/ChatWorkspace.tsx; visibility/mobile/cleanup.
- [x] T004 [US1/US2] После T003 создать src/components/ChatUnreadBadge и добавить counts в ChatListPanel/ChatList/ChatListItem/ConversationHeader/ConversationBackButton; токены и адаптивный макет.
- [x] T005 [US1/US2] После T004 расширить tests/integration/unread-notifications.spec.ts; создать tests/query/unread-indicators.spec.ts и UnreadProbe, подключить app/page.tsx и explicit id в lib/notification-fixture.ts; реальные компоненты, fake queue.
- [x] T006 [US1/US2] После T005 получить Green, провести Refactor по docs/CODING_RULES.md/CODE_STYLE.md, итоговые tests/lint/styles/format/types/build/E2E и визуальное preview; зафиксировать результат specs/026-unread-chat-indicators/verification.md.
- [x] T007 [US1/US2] После T006 обновить docs/project-overview.md, статусы этого комплекта и acceptance.md; выполнить итоговый read-only analyze и отдельно сохранить analysis.md; проверить diff/секреты/область изменений.

## Dependencies & Execution Order

T001 подтверждённый Red → T002 → T003 → T004 → T005 → T006 Green/Refactor/итоговые проверки → T007. Ошибки окружения Red не заменяют. Сервер не меняется. Все тесты сохраняются.

## Coverage

| Требование/критерий | Задачи |
| --- | --- |
| FR-001 | T001,T002,T005,T006 |
| FR-002 | T002,T005,T006 |
| FR-003 | T002,T003,T005,T006 |
| FR-004 | T003,T005,T006 |
| FR-005 | T003,T005,T006 |
| FR-006 | T001,T002,T005,T006 |
| FR-007 | T004,T005,T006 |
| FR-008 | T003,T004,T005,T006 |
| FR-009 | T002,T004,T005,T006 |
| FR-010 | T002,T003,T005,T006,T007 |
| SC-001 | T001,T002,T005,T006 |
| SC-002 | T003,T005,T006 |
| SC-003 | T004,T005,T006 |
| SC-004 | T002,T005,T006 |
| SC-005 | T006,T007 |

## Completion / Operator-only actions

Завершить только после проверки, preview, code style review и актуального verification. Установки/БД/Git mutations не нужны. Следующие задачи отдельно согласуются. Название коммита: feat: add unread message counters to chat navigation. Коммит не создавать.
