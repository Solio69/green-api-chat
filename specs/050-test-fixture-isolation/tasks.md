# Tasks: изоляция тестовых фикстур 050

- [x] T001 Зафиксировать baseline и инвентарь process-global/DOM/Query resources, таймеров и контрактных oracle по research/quickstart.
- [x] T002 Провести read-only анализ spec/checklist/plan/research/model/contract/quickstart/tasks против исходников и C1–C8; сохранить отдельный `analysis.md` и дать ссылку пользователю.
- [x] T003 Добавить проверку очистки состояния fake и отсутствия поздних событий; получить поведенческий Red на старой фикстуре, затем сохранить тест.
- [x] T004 Разделить `tests/constants.ts` по областям, оставить compatibility barrel; заменить production-constrained oracle в Query fake. Создать E2E и Query automatic fixtures с reset в setup/finally и защитой async generation; перевести все specs; заменить arbitrary sleep управляемой развязкой.
- [x] T005 Выполнить отдельные/переставленные сценарии, отрицательный контроль oracle, полный typecheck/lint/styles/format/Vitest/integration/Query/E2E по quickstart; зафиксировать результаты.
- [x] T006 Read-only post-analysis, предкоммитное ревью всех тестовых файлов/секретов/границ, исправления одной серией, итоговая регрессия и `verification.md`.
- [x] T007 Commit/push кода в `refactor`, дождаться quality/browser CI+artifacts; обновить roadmap/spec/tasks/verification, commit/push документации и дождаться CI. Английский коммит: `test: isolate browser and query fixtures`.

Зависимости: 029/030/049 → T001 → T002 → T003 → T004 → T005 → T006 → T007. FR-001: T001/T004–T006; FR-002/004: T003–T006; FR-003/006: T004–T006; FR-005: T001/T004–T006; FR-007/008: T005–T007. SC-001–003: T005–T007. Новых библиотек и продуктового поведения нет.
