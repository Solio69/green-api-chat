# Research 047: профиль аккаунта

Дата: 2026-10-04. Текущая модель `src/lib/account` содержит нормализацию `unknown` в `{label, avatarUrl}`: подпись — очищенный username либо phone, avatar — абсолютный HTTPS URL без реквизитов и с проверкой значений сессии. `getAccountSettings` в `src/lib/green-api` использует общий transport, свой retry и классификацию состояния. `resolveHome` принадлежит `auth/application`; страница получает готовый профиль, `AccountHeader`/`AccountAvatar` его отображают. UI не вызывает provider. Regression уже включает integration `account-profile`, `get-account-settings`, `home-flow` и production E2E `account-profile`.

| Вариант | Преимущества | Издержки и риск | Решение |
| --- | --- | --- | --- |
| Оставить текущие каталоги и добавить тесты | Минимальный diff | Граница account остаётся неявной | Не выбран |
| Перенести model/UI в feature, дать server entry существующему адаптеру | Явные слои, нет изменения transport/retry, малый риск | Надо обновить consumers/tests и проверить type-only граф | Выбран |
| Переписать provider adapter или `resolveHome` вместе с UI | Можно унифицировать имена файлов | Меняется сетевой/авторизационный контракт без необходимости | Не выбран |

`getAccountSettings` остаётся в server-only `lib/green-api` как provider adapter до архитектурного прохода 054; `features/account/server` экспортирует его тип и функцию, служа явной границей для app/auth. `features/account/model` экспортирует профиль и нормализацию; `features/account/ui` экспортирует `AccountHeader` и локально использует `AccountAvatar`. Единого barrel с server и UI нет. Нормализация остаётся чистой функцией, хотя её аргумент содержит credentials: она вызывается только на сервере, а клиент получает лишь `{label, avatarUrl}`. Новых пакетов, хранилища, DTO или серверных вызовов нет.
