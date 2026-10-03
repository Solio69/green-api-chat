# Проверки и эксплуатация 033

Локальные эквиваленты:

~~~powershell
npm run typecheck
npm run lint
npm run lint:styles
npm run format:check
npm test
npm run test:integration
~~~

Workflow на GitHub сам выполняет npm ci в чистом runner; локально повторная
установка для этой задачи не требуется. Логи доступны в Actions шаге и
artifact quality-<run_attempt> в течение 7 дней.

Push refactor уже запускает CI. Manual workflow_dispatch станет доступен после
включения workflow в default branch main; main в этом чате не меняется.
Для read-only проверки использовать GitHub Actions run/job API с head_sha.
Существующая Git-аутентификация может применяться в памяти, без вывода токена.

Приёмка включает контролируемый remote failure и восстановление, описанные
в research/plan. Фактические SHA, run URL и ограничения — verification.md.
