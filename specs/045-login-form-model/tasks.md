# Tasks: модель формы входа 045

Input: [spec](spec.md), [plan](plan.md), [research](research.md), [модель](data-model.md), [контракт](contracts/login-form.md). Цикл и commit/push `refactor` авторизованы.

- [x] T001 Сверить текущие LoginForm/LogoutButton, auth routes и существующие тесты; записать baseline входа, отказа, выхода, prehydration, фокуса и HTML контрактов.
- [x] T002 Провести read-only analyze комплекта spec/checklist/research/plan/data-model/contract/quickstart/tasks и C1–C8, записать analysis.md отдельным действием, устранить findings до кода.
- [x] T003 Добавить `tests/unit/login-client.test.ts` и `tests/component/login-form.test.tsx`/`logout-button.test.tsx`, в том числе новую защиту от позднего ответа после unmount. Запустить подтверждённый поведенческий Red именно для неё.
- [x] T004 Добавить `features/auth/ui/LoginForm/{request-login,use-login-form}.ts` и `features/auth/ui/LogoutButton/{request-logout,use-logout}.ts`; перенести четыре auth-компонента из `src/components` в `features/auth/ui`, обновить публичный entry и внешние импорты; оставить LoginForm/LogoutButton отображением. Сохранить DOM/API и выполнить targeted Green.
- [x] T005 Refactor компонентов, проверить double submit, отказ/повтор, фокус, reveal, keyboard, prehydration/credential safety, logout/cookie и поздний ответ. Исправлять только доказанные расхождения.
- [x] T006 Повторный read-only analyze, typecheck/lint/styles/format, полный Vitest/integration/Query/production E2E, client/server graph, `git diff --check`, проверка секретов; записать verification.md.
- [x] T007 Предкоммитное review точного diff, commit/push `refactor`, обе GitHub CI jobs на кодовом SHA; обновить roadmap/spec/verification и подтвердить CI итогового документационного SHA.

044 + 036 + 030 → T001 → T002 → T003 Red → T004 Green → T005 Refactor → T006 → T007.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T001, T003–T006 |
| FR-008 | T001, T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T003–T007 |
| SC-003 | T001, T003–T007 |

Название коммита: `refactor(auth): separate login form behavior`.
