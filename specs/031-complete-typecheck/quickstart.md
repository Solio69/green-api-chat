# Проверки 031

Из корня проекта, установленных пакетов достаточно:

~~~powershell
npm run typecheck
npm run typecheck:app
npm run typecheck:tests
npm run typecheck:query
npm test
npm run lint
npm run lint:styles
npm run format:check
~~~

Контроль конфигурации: по очереди создать новый временный .ts/.tsx файл с
export const typecheckProbe: number = 'wrong' в src, tests/unit,
tests/component и query fixture components. Общая команда должна дать TS2322.
Восстановить исходное состояние в finally. Не сохранять такие файлы.

Проверить чистую генерацию типов и отсутствие неохваченных TS-файлов,
как описано в plan.md. Факты после выполнения: verification.md.
