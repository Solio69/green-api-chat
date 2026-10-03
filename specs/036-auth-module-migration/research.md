# Исследование 036: перенос auth-модуля

Дата: 2026-10-03. Основание: [архитектурная карта](../../docs/architecture.md)
и [пофайловое владение](../035-feature-module-boundaries/ownership-map.csv).
035 задаёт `features/auth` как первый модуль; 037 отдельно переносит
`src/lib/auth/session.ts`, 045 разделяет поведение формы. Текущий
`src/lib/auth` содержит `constants.ts`, `get-query-scope.ts`,
`handle-login-request.ts`, `resolve-home.ts`, `resolve-login.ts`,
`session.ts`. Первые пять относятся к 036, `session.ts` — к 037.

`src/lib/auth/constants.ts` смешивает server cookie/env настройки
(`AUTH_CONFIG`, `IS_PRODUCTION`, `AUTH_ERROR_MESSAGE`) и нейтральные
`AUTH_QUERY`/`HOME_RESULT_KIND`. Перед переносом его нужно разделить:
иначе UI/модель сможет импортировать модуль, читающий server env.
`getQueryScope` сейчас импортирует тип сессии из будущей 037 и
CHAT_QUERY_CONFIG из будущей 048; это явно временные зависимости.
`resolveHome` и `resolveLogin` получают проверки провайдера и запись
сессии как функции-параметры. Их ответы не должны меняться при переносе.

## Варианты

| Подход | Плюс | Риск/решение |
| --- | --- | --- |
| Переместить сразу весь auth, UI и session | Один большой diff | Смешивает 036, 037 и 045, трудно отделить регрессию; отклонено |
| Переместить только пять назначенных файлов и public entries | Структура появляется без изменения поведения | Временные связи с `session.ts` и chats остаются до 037/048; выбрано |
| Оставить старые re-export файлы бессрочно | Мало правок потребителей | Бессрочная двойная точка входа и скрытая зависимость; отклонено |
| Обновить потребителей/тесты на новые public entries | Ошибки границы видны при typecheck/build | Больше механических импортов; выбрано |

Серверный вход не реэкспортируется из `model`/`application`/`ui`.
`src/app/api/auth/**/route.ts` и страницы остаются на местах:
Next.js требует route handler внутри `app`; Client Component граф не
должен втянуть server-политику и секреты. Новых пакетов не требуется.

Регрессии по 028/035: 24-часовой TTL, HttpOnly, SameSite=Lax,
Secure только в production, повреждённая/истёкшая cookie, временный
отказ провайдера без потери сессии, ручной выход, завершение только
текущей браузерной сессии, Query cleanup при выходе.

## Источники

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers): маршруты остаются внутри app.
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): границы `use client` и риск server import в client graph.
- Фактические `src/lib/auth`, `src/app`, `tests/integration/{session,auth-flow,home-flow,login-route,chats-api}.spec.ts`, `tests/e2e/{login-flow,logout-flow,home}.spec.ts` и 035.
