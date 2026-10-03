# Quickstart 040

1. Установить `SPECIFY_FEATURE_DIRECTORY` абсолютным `D:\Pet-projects\green-api-chat\specs\040-notification-state-model`; проверить `FEATURE_DIR` через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Подтвердить baseline `tests/integration/polling-connection.spec.ts` и подходящие browser UI-сценарии. Прочитать матрицу `research.md`.
3. Выполнить read-only analyze и сохранить `analysis.md` отдельно. Написать unit-таблицу новой модели и подтвердить поведенческий Red, затем Green.
4. Подключить модель к текущему контроллеру, оставить сеть/lease/таймеры в нём. Проверить ACK, retry, recovery, late events, отправку и предупреждения через integration/RTL.
5. Выполнить полный typecheck/lint/styles/format/Vitest/integration/query/production E2E; проверить `git diff --check` и границы импортов.
6. Review точного diff, commit/push `refactor`, обе GitHub jobs на SHA кода, обновить verification/roadmap/spec и проверить итоговый SHA.

Новые пакеты, реальные реквизиты и серверные изменения не нужны.
