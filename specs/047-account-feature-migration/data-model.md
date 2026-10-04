# Data Model 047: профиль аккаунта

| Сущность | Владелец | Поля/инварианты | Потребитель |
| --- | --- | --- | --- |
| Provider account payload | `lib/green-api/get-account-settings` | `unknown` до классификации состояния и нормализации, не попадает в UI | account model на сервере |
| `AccountProfile` | `features/account/model` | `label: string`, `avatarUrl: string`; пустая строка при отсутствии/небезопасности | account UI, серверный результат |
| `AccountSettingsResult` | `features/account/server` публичный type alias к adapter | authorized содержит нормализованный профиль; остальные ветки сохраняют StateResult | auth/application, app |
| Avatar load state | `features/account/ui/AccountAvatar` | неудачный URL локален компоненту; иконка fallback | UI |

Профиль не сохраняется; credentials передаются в чистую нормализацию только на сервере для защиты от их отображения. UI получает сериализуемый профиль без DTO и сессионных полей. Смена username/phone/avatar и редактирование отсутствуют.
