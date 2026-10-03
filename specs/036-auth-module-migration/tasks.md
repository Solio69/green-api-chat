# Tasks: auth module migration 036

Input: [spec.md](spec.md), [plan.md](plan.md). Авторизован полный
цикл с review/commit/push в refactor.

- [x] T001 Сверить 035/030, пять назначенных auth-файлов, session.ts, маршруты, импорты и baseline; подготовить research/plan/data-model/contract/quickstart.
- [x] T002 Провести read-only анализ полного комплекта, C1–C8, FR/SC и точного объёма; findings устранить до кода.
- [x] T003 Переместить чистые и application auth решения, разделить смешанные constants по model/server, создать раздельные public entries; сохранить поведение.
- [x] T004 Переместить server handler и getQueryScope; обновить transitional session.ts и все routes/pages/notifications/tests на публичные входы. Не трогать реализацию session/формы.
- [x] T005 Проверить отсутствие старых импортов, typecheck, lint/style/format, unit/integration/query/full E2E, server/client границу и предкоммитный diff; исправить регрессии.
- [ ] T006 Обновить verification/roadmap, commit/push refactor и подтвердить обе GitHub jobs на фактическом head_sha.

035 и 030 → T001 → T002 → T003 → T004 → T005 → T006.

| Требование | Задачи |
| --- | --- |
| FR-001 | T003–T005 |
| FR-002 | T003–T005 |
| FR-003 | T001, T004, T005 |
| FR-004 | T001, T004–T006 |
| FR-005 | T004, T005 |
| FR-006 | T001, T003–T005 |
| SC-001 | T005, T006 |
| SC-002 | T005, T006 |
| SC-003 | T004–T006 |
