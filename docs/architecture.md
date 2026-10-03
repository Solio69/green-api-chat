# Архитектурные границы GREEN-API Chat

Это целевая карта для задач 036–049 и финальной сверки 054. Она не
утверждает, что текущие каталоги уже перенесены. Полный инвентарь
tracked файлов и назначений: [ownership-map.csv](../specs/035-feature-module-boundaries/ownership-map.csv).
На момент 035 карта содержит 251 файл `src` и 109 файлов `tests` — ровно
множество `git ls-files src tests`. Новые файлы последующих задач
получают владельца при создании; 054 сверяет итоговое дерево.

## Границы и ответственность

| Владелец | `src` | `tests` | Ответственность |
| --- | ---: | ---: | --- |
| auth | 25 | 11 | Вход, выход, session scope, cookie-сессия; UI входа отдельно от серверного секрета |
| account | 11 | 6 | Профиль подключённого аккаунта и его отображение |
| recipients | 22 | 6 | Валидация и поиск получателя, форма и результат |
| chats | 29 | 12 | Список чатов, известные профили и метки; не владеет перепиской |
| conversation | 127 | 33 | Выбор, история, сообщения, отправка, уведомления и unread |
| shared | 19 | 0 | Действительно общие UI-примитивы, протокольные константы и нейтральный Query runtime |
| server | 12 | 0 | Транспорт GREEN-API и серверные адаптеры без клиентских экспортов |
| shell | 6 | 0 | Next.js composition, health и глобальное оформление |
| test-platform | 0 | 41 | Runner setup, общие фикстуры и тестовая инфраструктура |

Пути `src/app/api/**/route.ts`, `page.tsx` и `layout.tsx` остаются там,
где их требует Next.js. Их бизнес-владелец указан в CSV, а реализация
сценария переносится за тонкую границу route/page composition. В
`src/styles` сохраняются общие токены, тема и миксины; CSS конкретного
компонента идёт рядом с ним. `SubmitButton` и `ChatUnreadBadge`
используются несколькими областями и относятся к `shared/ui` по
фактическим потребителям, а не по предположению о переиспользовании.

## Целевое дерево и входы

```text
src/app/                          # Next routes/pages/layout, только composition
src/features/
  auth/{model,application,ui,server}/
  account/{model,application,ui,server}/
  recipients/{model,application,ui,server}/
  chats/{model,application,ui,server}/
  conversation/
    {selection,history,messages,sending,notifications,unread}/
    ui/
src/shared/{kernel,ui,query}/
src/server/{http,green-api,session}/
src/styles/                       # действительно общая тема/токены
```

Не нужно создавать все показанные каталоги заранее. Слой появляется,
когда у модуля есть такая роль. `model` содержит чистые данные и правила;
`application` координирует use-case/Query; `ui` содержит React/браузер;
`server` получает доверенный контекст и вызывает серверные адаптеры.
Публичные пути — `@/features/<name>/model`, `/application`, `/ui`,
`/server` по наличию. Один корневой barrel с серверными и клиентскими
экспортами запрещён: он скрывает границу `use client` и может втянуть
неправильный граф импортов. Внутренние файлы доступны из собственной
области; внешние потребители пользуются её public entry.

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

Этот целевой граф ацикличен: shared не знает features, чистая модель
не знает React/Next/TanStack Query, серверного runtime или fetch.
Cross-feature вызов допускается через публичный контракт без обратной
зависимости; когда два модуля должны обменяться данными, orchestration
находится в conversation/application или в app composition. HTTP DTO
и чистая модель могут разделяться, но cookie-секрет, GREEN-API URL
с реквизитами и session runtime остаются server-only. Client entry
содержит фактическую границу `use client`; из неё нельзя импортировать
server entry. Никакого нового state manager эта карта не требует.

Текущие нарушения, которые ещё предстоит исправить:

| Текущая связь | Почему проблема | Задача устранения |
| --- | --- | --- |
| `src/lib/query/create-query-session.ts` ↔ `src/lib/chats/session-chat-facts.ts` | Файловый цикл; общий Query-сеанс знает загрузку чатов, обратная связь хотя бы type-only | 043/044/048: нейтральный порт или feature-specific composition |
| `src/lib/chats`, `history`, `messages`, `unread` → `src/components/QueryProvider` | Логика получает контекст через глобальный UI-модуль | 043/044/048: публичный client Query entry и локальные адаптеры |
| `src/lib/history/use-chat-history.ts` → `ConversationSelectionProvider` | Привязка истории к глобальной UI-композиции | 043/049: явный контракт выбора и orchestration |
| `src/app/api/**/route.ts` → разрозненные handlers и transport | Обвязка повторяется и server boundary трудно проверить | 037–039: общий контекст, guards, transport; route остаётся в app |

Текущий граф — 210 TS/TSX файлов и 621 связь импорта/реэкспорта.
Описанные нарушения остаются допустимыми только как переходное
состояние до назначенных задач; целевой контракт их запрещает.

## Порядок переноса и временные входы

| Задача | Основной результат | Что становится переходным до удаления |
| --- | --- | --- |
| 036 | Auth module и явные его публичные входы | `src/lib/auth/*`, `src/components/LoginForm` и auth routes — до 037/045 |
| 037 | Единый серверный контекст сессии | Прямые cookie/session вызовы в route и feature handlers |
| 038 | Общие HTTP guards/DTO | Разрозненные `src/lib/api`, `src/lib/http` импорты |
| 039 | GREEN-API transport и политики отправки | Прямые `src/lib/green-api` импорты из handlers |
| 040–041 | Состояния и runtime уведомлений | `src/lib/notifications` и `NotificationProvider` |
| 042–044 | Чистая модель сообщений, cache coordinator, владение Query/session | `src/lib/messages`, `history`, `sending`, `unread`, `query`; указанный файловый цикл |
| 045–047 | UI входа, recipients, account | Соответствующие глобальные `src/components/*` |
| 048 | Chats feature и его public entries | `src/lib/chats`, `ChatList*`, `ChatSidebar` |
| 049 | Композиция conversation UI | Остальные `src/components/Conversation*`, `ChatWorkspace`, `Message*` |
| 050–053 | Изоляция фикстур и миграция тестов по уровню проверки | Существующие тестовые пути и общие фикстуры |
| 054 | Архитектурная сверка | Удалить оставшиеся compatibility barrels/импорты |

Десять нынешних `types.ts`/`constants.ts` в chats, history, messages,
sending и notifications имеют `disposition=split`: чистые DTO и факты
отделяются от Query-конфигурации, `Request` и server credentials во
время указанной миграции. `target_area` для них намеренно указывает
feature, а не преждевременно объявляет весь файл чистым `model`.

Строка CSV задаёт срок для каждого текущего пути; если файл остаётся
в `app`, `styles` или runner, `disposition=retain/adapt` объясняет
почему. Совместимый re-export разрешён только во время назначенной
задачи и удаляется в 054. Нельзя создавать новый `src/lib`-каталог
без определённого владельца.

## Совместимость с правилами кода и проверка

Сохраняются PascalCase каталога/компонента/SCSS-модуля, локальный
`index.ts`, соседние `constants.ts`, `./` внутри каталога и `@/`
между каталогами. [CODING_RULES](CODING_RULES.md) уточняет, что для
перенесённого feature-компонента эти правила действуют внутри
`features/<name>/ui`, а общие элементы — внутри `shared/ui`.
Правило констант и остальные соглашения стиля не меняются.

Карта проверяется точным сравнением CSV с `git ls-files src tests`,
непустыми owner/target/task, а целевой DAG — ревью всех допустимых
направлений. Исторический цикл остаётся явно обозначенным до 044/048.
Тесты поведения выполняются в задачах переноса; 035 не меняет runtime.
После последующего перемещения обновляются импортные пути и тесты,
а 054 сверяет фактический граф, старые входы и обновлённую карту.

Основание среды: [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers),
[TanStack Query Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr).
