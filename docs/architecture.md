# Архитектурные границы GREEN-API Chat

Приложение организовано по функциональным модулям. Историческая [карта владения 035](../specs/035-feature-module-boundaries/ownership-map.csv) фиксирует исходные назначения; [итоговая карта 054](../specs/054-architecture-final-review/migration-map.json) связывает 69 оставшихся старых файлов с конечными путями. Результаты проверки дерева, графа импортов и регрессии находятся в [verification 054](../specs/054-architecture-final-review/verification.md).

## Структура

```text
src/app/                         Next.js routes, pages, layout и композиция
src/features/
  auth/                          вход, выход, состояние подключения
  account/                       профиль аккаунта
  recipients/                    поиск получателя
  chats/                         список чатов и его данные
  conversation/
    selection/                   выбор собеседника
    history/                     история сообщений
    messages/                    факты и cache сообщений
    sending/                     отправка и состояние редактора
    notifications/               polling и доставка уведомлений
    unread/                      непрочитанные сообщения
    application/                 координация сценария переписки
    ui/                          интерфейс переписки и QueryProvider
src/shared/kernel/               чистые общие типы и константы
src/shared/query/                нейтральный Query-сеанс и React-контекст
src/shared/ui/                   общие визуальные примитивы
src/server/                      доверенные session, HTTP и GREEN-API адаптеры
src/styles/                      общие токены и миксины
```

Каталог слоя создаётся только при наличии реальной роли. `model` содержит данные и чистые правила; `application` координирует use-case и Query; `ui` содержит React и браузерное поведение; feature `server` реализует серверный сценарий; `src/server` содержит доверенные адаптеры. Файлы `route.ts`, `page.tsx` и `layout.tsx` остаются в `src/app` по контракту Next.js. Компонентный SCSS-модуль лежит рядом с компонентом, общие токены — в `src/styles`.

## Направление зависимостей

```text
app → feature/ui, feature/server, shared/ui
feature/ui → feature/application, feature/model, shared/ui, shared/query
feature/server → feature/application, feature/model, server adapters
feature/application → feature/model, shared/kernel, shared/query
server adapters → feature/model, shared/kernel
feature/model → shared/kernel
shared/query и shared/ui → shared/kernel
```

Стрелка показывает разрешённое направление, но не требует такого импорта в каждом модуле. Межмодульную связь оформляем через публичный вход нужного слоя, а координацию нескольких функциональных областей размещаем в conversation/application или `app`. Серверный и клиентский код не смешиваются в корневом barrel. `shared/query/ui/QuerySessionProvider` содержит только нейтральный контекст и TanStack Query provider; `features/conversation/ui/QueryProvider` создаёт сеанс подключения и обрабатывает навигацию при истечении авторизации. Благодаря этому общая инфраструктура не зависит от переписки.

Общие типы, нужные серверу и клиенту, размещены в чистых model/kernel или в узком type-only контракте адаптера. Реквизиты, cookie и вызовы GREEN-API остаются в серверном runtime. `src/features/**/model` не импортирует React, Next, Query или server; `src/features/**/application` не импортирует UI и server; клиентский UI не импортирует server. `eslint.config.mjs` проверяет эти направления по каталогам. Положительные и отрицательные примеры правила проверены самим ESLint. В проекте не добавлен пакет `server-only`: существующие границы Next и ESLint покрывают этот объём без новой зависимости; проверка клиентского графа входит в архитектурный аудит.

## Публичные входы и соразмерность

Внешний потребитель импортирует публичный `@/features/<name>/<layer>` по роли, когда entry существует. Поддомены переписки используют собственные `model`, `application`, `ui` и `server` входы по необходимости. Внутри своей папки используется `./`, между папками — `@/`. Локальный `index.ts` компонента раскрывает только его контракт. Новые абстракции добавляем при реальном втором потребителе или при явном разделении ответственности; разные политики GREEN-API операций остаются видимыми.

Старые `src/lib` и `src/components` не содержат исходных файлов и не являются местом для нового кода. Исторические спецификации и CSV сохраняются для прослеживаемости. Для будущего изменения сначала фиксируем владельца и его границу, затем меняем код и регрессионные проверки.

Основание: [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [TanStack Query Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
