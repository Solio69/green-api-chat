# Контракт импортов 035

Разрешённый ориентированный граф:

```text
src/app (Next composition) → feature/ui | feature/server | shared/ui
feature/ui → feature/application | feature/model | shared/ui | shared/query
feature/application → feature/model | shared/kernel | shared/query
feature/server → feature/application | feature/model | src/server/*
src/server/* → feature/model | shared/kernel
feature/model → shared/kernel
shared/query → shared/kernel
shared/ui → shared/kernel
```

Рёбра вниз по этой схеме не образуют циклов. Cross-feature импорт
допустим только через объявленный public entry и без обратного ребра;
для текущих зависимостей чатов и переписки оркестрация располагается
в conversation/application или app composition. В частности,
`shared/query` не импортирует chats, а `feature/model` не импортирует
React, Next.js, UI, server runtime, fetch или TanStack Query.

Публичные точки входа: `features/<name>/model`,
`features/<name>/application`, `features/<name>/ui`,
`features/<name>/server` по наличию роли. Никакого корневого barrel,
который реэкспортирует одновременно server и client. Внутренние
файлы другого feature напрямую не импортируются. Внутри текущего
каталога действуют относительные импорты, между каталогами — `@/`.

`src/app/api/**/route.ts` сохраняет путь и HTTP-контракт, вызывая
server entry. Cookie/секреты, вызовы GREEN-API и доверенный контекст
живут в server-only runtime. Shared DTO и чистая модель не импортируют
этот runtime. Client entry помечен `use client` на фактической границе.

Временные входы `src/components/*` и `src/lib/*` принадлежат указанным
в ownership-map.csv модулям. Их потребители переводятся вместе с
задачами 036–049; 054 запрещает оставшиеся переходные feature-импорты.
Исключение `src/app`, `src/styles` и подлинно общие shared средства
не требуют фиктивного переноса.

Контроль текущих нарушений: цикл session-chat-facts ↔
create-query-session (044/048), domain hook → QueryProvider (044/048),
history hook → ConversationSelectionProvider (043/049). Они описаны
как переходы, не как разрешённые связи целевой архитектуры.
