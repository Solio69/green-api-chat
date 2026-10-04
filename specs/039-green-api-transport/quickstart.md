# Quickstart 039

1. Установить `SPECIFY_FEATURE_DIRECTORY` равным абсолютному `D:\Pet-projects\green-api-chat\specs\039-green-api-transport`; проверить exact `FEATURE_DIR` через `check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks -ExpectedFeatureDirectory`.
2. Прочитать матрицу `research.md`, подтвердить baseline существующих provider integration-тестов до кода.
3. Выполнить read-only analyze и сохранить отдельный `analysis.md`. После этого создать unit API транспорта и подтвердить поведенческий Red, затем Green.
4. Переносить адаптеры по одному, сохраняя их signal, retry, status mapping и существующие test-инъекции. SendMessage и notifications проверить отдельно.
5. Выполнить full typecheck/lint/styles/format/Vitest/integration/query/production E2E, граф серверных импортов и `git diff --check`.
6. Review точного diff, commit/push `refactor`, подтвердить обе GitHub jobs на SHA кода, обновить verification/roadmap/spec и проверить итоговый SHA.

Новые пакеты и реальные GREEN-API реквизиты не нужны.
