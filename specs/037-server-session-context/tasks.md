# Tasks: единый серверный контекст 037

Input: [spec.md](spec.md), [plan.md](plan.md), [contract](contracts/server-session.md). Пользователь разрешил полный цикл и commit/push в `refactor`.

- [x] T001 Изучить 036, cookie/session/routes/page/notification/send и исходные tests; оформить research, plan, data-model, contract, quickstart; проверить baseline интеграционных сценариев до кода.
- [x] T002 Провести read-only анализ полного комплекта и C1–C8, трассировку FR/SC; сохранить отдельный analysis.md после прохода, устранить findings до кода.
- [x] T003 Написать `tests/unit/server-session-context.test.ts` для `unconfigured`, `missing` (нет/битая/истекшая cookie), `authorized`, scope, двух stores и отсутствия записи. Запустить `npx vitest run --project node tests/unit/server-session-context.test.ts`, подтвердить поведенческий Red (не import failure).
- [x] T004 Перенести `src/lib/auth/session.ts` в `src/server/session/iron-session.ts`; реализовать `types.ts`, `read-request-session.ts` и server entry, убрать старый type-only import в `get-query-scope.ts`; довести T003 до Green без изменения cookie.
- [x] T005 Реализовать read-only page и route adapter в `src/server/session`; перевести `src/app/page.tsx`, auth login, chats, history, recipients, messages и notification route; удалить `src/lib/notifications/request-context.ts`. Сохранить password только для notification ACK и старые HTTP/redirect контракты.
- [x] T006 Выполнить Refactor и повторить unit Green, typecheck, lint/styles/format, весь Vitest, integration/query/production E2E; проверить client/server graph, независимость messages от notifications, отсутствие legacy session imports, точный diff и реальные секреты.
- [x] T007 Повторить read-only analyze, обновить verification/spec/roadmap, провести предкоммитное ревью, commit/push `refactor`, подтвердить обе GitHub jobs на head_sha и итоговом docs SHA.

036 → T001 → T002 → T003 Red → T004 Green → T005 → T006 Refactor/verification → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T003–T006 |
| FR-002 | T003–T006 |
| FR-003 | T003–T006 |
| FR-004 | T001, T005–T006 |
| FR-005 | T003–T006 |
| FR-006 | T002–T006 |
| FR-007 | T004–T006 |
| SC-001 | T005–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

Английское имя коммита: `refactor(session): centralize request session context`. Необходимых действий пользователя и новых зависимостей нет.
