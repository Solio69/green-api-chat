# Implementation Plan: auth migration 036

Spec: [spec.md](spec.md). Дата: 2026-10-03. Чистый структурный
перенос без изменения ответов, cookie, URL и визуального поведения.

## Целевые файлы и входы

```text
src/features/auth/model/{constants.ts,index.ts}
src/features/auth/application/{resolve-home.ts,resolve-login.ts,index.ts}
src/features/auth/server/{constants.ts,get-query-scope.ts,handle-login-request.ts,index.ts}
```

`model` экспортирует `AUTH_QUERY`, `HOME_RESULT_KIND`;
`application` — `resolveHome`, `resolveLogin` и соответствующие типы;
`server` — server-конфигурацию, `getQueryScope`,
`handleLoginRequest`. Корневого смешанного `index.ts` нет.
`src/lib/auth/session.ts` остаётся до 037; его импорт server-констант
временно может указывать в auth/server. Он не должен импортировать
server barrel, который сам зависит от session type.

Точные перемещения: пять назначенных 035 файлов `src/lib/auth`,
разделение constants; затем обновление всех `src/app`,
`src/lib/notifications/request-context.ts` и integration тестов,
которые читают старые пути. Удалить старые пути после проверки
потребителей; совместимый re-export только при доказанном потребителе
с задачей удаления. `session.ts`, `LoginForm`, `LogoutButton`,
cookie-flow и общий server context не перемещаются здесь.

## Границы

`app/page.tsx` и `app/api/**/route.ts` остаются Next composition.
Серверные импорты через `@/features/auth/server`, чистые решения через
`@/features/auth/application`, URL-причины через
`@/features/auth/model`. Прямые импорты auth internals из других
областей запрещены после переноса; исключение — transitional
`src/lib/auth/session.ts` до 037 и зависимость getQueryScope от
CHAT_QUERY_CONFIG до 048. Старые `src/lib/auth/*` импорты не должны
оставаться для пяти перемещённых файлов.

## Проверки

До кода read-only анализ полного комплекта и baseline целевых
integration/E2E. Искусственный Red для перемещения не нужен.
После каждого шага typecheck. В конце целевые session/auth/home/login,
полный integration, query, production E2E, unit, lint/style/format,
production build через E2E webServer. Проверить import graph:
нет ссылок на пять старых путей, client modules не импортируют
auth/server и `src/lib/auth/session.ts`, маршруты/URL сохранены.
Предкоммитный review, commit/push только refactor, GitHub Actions
quality и browser на фактическом head_sha. Итоговый verification и
roadmap отдельным commit с последующим CI.

## Конституция C1–C8

C1 PASS: варианты/цена в research. C2 PASS: только миграция 036,
session/форма отдельно. C3 PASS: полный комплект/анализ до кода.
C4 PASS: refactor авторизована. C5 PASS: без новых зависимостей.
C6 PASS: никакие реальные credentials не добавляются. C7 PASS:
существующие поведенческие тесты и CI, без искусственного Red.
C8 PASS: public entries по среде, App Router пути сохраняются.
