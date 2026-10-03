# Tasks: модуль профиля 047

Input: [spec](spec.md), [plan](plan.md), [research](research.md), [model](data-model.md), [contract](contracts/account-profile.md). Полный цикл/commit/push `refactor` разрешены.

- [x] T001 Сверить normalize-profile, get-account-settings, resolve-home, два UI-компонента и consumers с картой 035; подтвердить целевые integration и production E2E baseline.
- [x] T002 Провести read-only анализ spec/checklist/research/plan/model/contract/quickstart/tasks, C1–C8 и фактических путей; записать analysis.md отдельным действием.
- [x] T003 Добавить Vitest unit tests/unit/account-profile.test.ts и RTL tests/component/account-avatar.test.tsx и account-header.test.tsx для пустого/битого avatar, fallback label и доступного имени; проверить их на текущем поведении до переноса.
- [x] T004 Перенести `lib/account` в `features/account/model`, оба компонента в `features/account/ui`; добавить public entries model/ui/server; обновить get-account-settings, auth/application, app, Query fixture и тестовые импорты без изменения контракта.
- [x] T005 Выполнить Green и Refactor: проверить полный/частичный/ошибочный профиль, `resolveHome`, avatar fallback, темизацию, отсутствие credentials/DTO в UI и импортов server runtime в client.
- [x] T006 Выполнить typecheck/lint/styles/format, Vitest/integration/Query/E2E, post-analyze, diff/secret review; оформить verification.md.
- [x] T007 Предкоммитное review, commit/push `refactor`, обе GitHub CI jobs на кодовом SHA; обновить spec/tasks/roadmap/verification и проверить CI документационного SHA.

035 + 037 → T001 → T002 → T003 → T004 → T005 → T006 → T007. Изменений бизнес-логики или server-контракта нет, поэтому искусственный Red не требуется. Если при реализации понадобится поведение вне существующего контракта, для него до кода нужны отдельный тест и поведенческий Red.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T004–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T004–T006 |
| FR-004 | T001, T003–T006 |
| FR-005 | T002, T004–T006 |
| SC-001 | T004–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

Название кодового коммита: `refactor(account): isolate profile model and UI`.
