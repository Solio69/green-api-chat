# Research 045: форма входа и выход

Дата: 2026-10-03. Исходники: LoginForm, CredentialField, TokenVisibilityButton, LogoutButton, auth model/application/server, маршруты login/logout, e2e login-form/login-flow/login-form-safety/logout-flow. Существующий LoginForm совмещает fetch/разбор ответа, валидацию, состояние, фокус и JSX; LogoutButton совмещает запрос, закрытие QuerySession, навигацию и JSX. HTML-поля реквизитов не имеют `name`, до гидратации fieldset disabled; это часть безопасности. Локальных RTL-проверок формы/выхода пока нет; браузерные проверки уже есть. Новых пакетов и серверных контрактов не требуется.

| Вариант | Преимущество | Цена/риск | Решение |
| --- | --- | --- | --- |
| Вынести только fetch | Малый diff | Состояние, валидация и фокус останутся в разметке | Не выбран |
| Выделить клиентский adapter и локальные hooks для login/logout; оставить собственные UI-компоненты | Запрос и поведение тестируются без JSX, текущая верстка и доступность сохраняются | Нужно точно передать refs/handlers и проверить unmount | Выбран |
| Библиотека форм и глобальный store | Готовые API | Дополнительная зависимость и второе хранилище без нужды этого небольшого сценария | Не выбран |

`requestLogin` возвращает типизированный success/error без реквизитов в результате. Неожиданный JSON/ответ остаётся общей ошибкой, отказ сети — service unavailable. Адаптеры и hooks находятся рядом со своими компонентами в `src/features/auth/ui/LoginForm` и `src/features/auth/ui/LogoutButton`. Все четыре текущих auth-компонента (`LoginForm`, `CredentialField`, `TokenVisibilityButton`, `LogoutButton`) переносятся в `features/auth/ui` по карте 035; их внешние потребители используют публичный `features/auth/ui/index.ts`. `useLoginForm` владеет значениями, ошибками, focus refs, pending guard, token visibility и отменой запроса при unmount. `useLogout` владеет pending/error, вызовом адаптера, закрытием клиентской сессии и навигацией; native POST формы сохраняется. Публичный HTTP/cookie контракт не меняется. Возврат позднего ответа после unmount не меняет состояние нового экземпляра. Если пришлось бы менять уже наблюдаемое поведение, это выделяется в тесте Red до реализации.
