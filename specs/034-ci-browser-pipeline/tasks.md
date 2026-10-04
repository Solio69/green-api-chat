# Tasks: Browser CI 034

Input: [spec.md](spec.md), [plan.md](plan.md).
Авторизован полный цикл с commit/push в refactor.

- [x] T001 [US1] Проверить 033, Playwright configs, fake fixture и DEFECT-01; подготовить research, plan, data-model, contracts/browser-ci и quickstart.
- [x] T002 [US1] Провести read-only анализ полного комплекта, C1–C8 и трассировку FR/SC; отдельно записать analysis.md.
- [x] T003 [US1] Добавить регрессию задержанного ResizeObserver в tests/e2e/conversation-selection.spec.ts, подтвердить целевой поведенческий Red и отличить его от ошибки окружения.
- [x] T004 [US1] Исправить src/components/ChatWorkspace/use-workspace-focus.ts; подтвердить Green нового и старого сценария, сохранение внешнего фокуса.
- [x] T005 [US1] Добавить browser job в .github/workflows/quality.yml, HTML query report в playwright.query.config.ts, fail-fast provider origin в tests/e2e/fixtures/fake-green-api.ts, обновить README.md.
- [x] T006 [US1] Проверить YAML, type/lint/style/format, Vitest, query, полный E2E и повторы фокуса; предкоммитный рефакторинг/ревью, initial commit/push, реальный GitHub green и artifact.
- [x] T007 [US1] Временный runner-only browser failure: локальный контроль, review/commit/push, удалённый failure + HTML/trace/artifact; затем удалить контроль, review/commit/push и подтвердить green.
- [x] T008 [US1] Обновить verification, spec/checklist/tasks/analysis, docs/refactoring-roadmap.md, финальное ревью, commit/push и проверить итоговый head.

## Зависимости

033 → T001 → T002 → T003 Red → T004 Green → T005 → T006 →
T007 negative/restore → T008. Установка Chromium выполняется только в
согласованном CI. Query и E2E последовательно, без retries.

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T005, T006 |
| FR-002 | T001, T005, T006 |
| FR-003 | T005, T006 |
| FR-004 | T001, T005, T006 |
| FR-005 | T005–T007 |
| FR-006 | T003, T004, T006 |
| FR-007 | T005–T008 |
| FR-008 | T003, T004, T006 |
| SC-001 | T006, T007 |
| SC-002 | T007 |
| SC-003 | T005, T006, T008 |
| SC-004 | T003, T004, T006 |

T001/T002 — полный комплект и анализ, T008 — отчёт и ревью.
Новых product features или dependencies нет.
