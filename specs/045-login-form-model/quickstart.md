# Quickstart 045

1. Задать `SPECIFY_FEATURE_DIRECTORY=D:\Pet-projects\green-api-chat\specs\045-login-form-model`; вызвать prerequisites с `-ExpectedFeatureDirectory` и подтвердить точный FEATURE_DIR.
2. Прочитать комплект, baseline 044, LoginForm/LogoutButton, login/logout route и существующие e2e. Запустить targeted baseline и read-only analyze; записать findings отдельным действием.
3. Написать тест на поздний login-ответ после unmount, подтвердить поведенческий Red. Добавить браузерные adapters и локальные hooks, перенести четыре auth UI-компонента в `features/auth/ui` и обновить потребителей, выполнить Green/Refactor.
4. Проверить Vitest/RTL и browser сценарии формы, prehydration, logout/cookie, фокус и UI; затем полные typecheck/lint/styles/format/Vitest/integration/Query/E2E и граф импортов. Playwright последовательно.
5. Повторить read-only analyze, review/diff check, commit/push `refactor`, дождаться обеих CI jobs; обновить roadmap/spec/verification и проверить итоговый SHA.

Новых пакетов, реальных реквизитов и серверных изменений нет.
