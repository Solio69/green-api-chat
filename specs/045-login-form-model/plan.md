# Implementation Plan: модель формы входа 045

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-03. **Разрешение**: полный цикл 030–055 с commit/push в `refactor` поручен пользователем.

## Summary

Разделить HTTP login/logout, локальное управление состоянием/submit и отображение. Перенести LoginForm/CredentialField/TokenVisibilityButton/LogoutButton в `features/auth/ui` как UI-слой и существующие auth server/application решения. Хуки не записывают реквизиты вне компонента и не создают глобальный store. До гидратации реквизиты нельзя отправить нативной формой. Выход сохраняет POST fallback, завершение QuerySession и refresh/replace.

## Основание и C1–C8

[Research](research.md) фиксирует три варианта, преимущества и цену. C1 PASS: выбран локальный adapter + hook. C2 PASS: только login/logout, остальные формы в 046/047. C3–C4 PASS: пользователь разрешил реализацию и commit/push этого цикла. C5 PASS: без новых пакетов, БД и изменений сервера. C6 PASS: тесты используют фиктивные реквизиты, не пишут их в логи. C7 PASS: существующие browser тесты служат baseline; новая обработка unmount проходит Red → Green → Refactor. C8 PASS: сохраняем React и API проекта, располагаем UI по карте 035.

## Модель, контракт и файлы

[Модель](data-model.md), [контракт](contracts/login-form.md), [quickstart](quickstart.md). Новые `src/features/auth/ui/LoginForm/request-login.ts` и `src/features/auth/ui/LogoutButton/request-logout.ts` — браузерные адаптеры без React. Новые `src/features/auth/ui/LoginForm/use-login-form.ts` и `src/features/auth/ui/LogoutButton/use-logout.ts` — локальные состояния, refs, submit и lifecycle. Все файлы компонентов `LoginForm`, `CredentialField`, `TokenVisibilityButton`, `LogoutButton` из `src/components/*` переезжают в одноимённые каталоги `src/features/auth/ui/*` согласно CSV 035. В `src/features/auth/ui/index.ts` — публичный вход; `src/app/login/page.tsx`, `src/app/page.tsx`, `src/components/AccountHeader/AccountHeader.tsx` и QueryProbe обновляют импорты. Стили/DOM не меняются. Тесты: новый `tests/unit/login-client.test.ts`, `tests/component/login-form.test.tsx`, `tests/component/logout-button.test.tsx`; существующие `tests/e2e/login-form-safety.spec.ts`, `login-flow.spec.ts`, `logout-flow.spec.ts`, `login-ui.spec.ts`, `tests/integration/login-route.spec.ts` и `auth-flow.spec.ts`. Точные наборы уточняются после baseline/read-only анализа.

## Проверки и порядок

Сверить existing HTML и server contract; baseline. Провести read-only analyze spec/plan/tasks и C1–C8. Сначала тест на новую защиту unmount и подтверждённый поведенческий Red. Перенести адаптеры и состояние без изменения UX, выполнить Green и Refactor. Проверить двойной submit, отказ/повтор, фокус, reveal, keyboard, prehydration, cookie/logout, поздний ответ. Полные typecheck/lint/styles/format/Vitest/integration/Query/E2E, граф client/server, `git diff --check`, повторный read-only analyze, precommit review, commit/push и обе CI jobs кода и документации. Playwright наборы запускаются последовательно.

## Post-design C1–C8

PASS при сохранении текущего HTTP/DOM/UI контракта и отсутствии нового shared state. Отступлений от конституции нет.

## Complexity Tracking

Два маленьких hooks нужны для независимого поведения login и logout; единый универсальный form abstraction увеличил бы API без общей предметной логики.
