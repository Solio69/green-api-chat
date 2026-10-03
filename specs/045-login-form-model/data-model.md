# Data model 045: данные и переходы формы

| Сущность | Владелец | Срок жизни/граница |
| --- | --- | --- |
| `idInstance`, `apiTokenInstance` | Локальный `features/auth/ui/LoginForm/useLoginForm` экземпляра | Только память формы, не Query/cache/storage/log/URL; при unmount исчезает |
| `hasSubmitted`, `isSubmitting`, `requestPending` | `useLoginForm` | Проверка пустых полей, один активный POST; после отказа допускается повтор |
| `serverErrorCode` | `useLoginForm` | Сопоставление с существующим LOGIN_ERROR_COPY; изменение любого поля очищает отказ |
| `isTokenVisible` | `useLoginForm` | Только отображение input type; значение не меняет |
| `idInputRef`, `tokenInputRef` | `useLoginForm` | Фокус на первом отсутствующем поле; refs живут в экземпляре |
| `requestLogin` result | Клиентский adapter | `{kind:'success'}` или `{kind:'error', code}`; без исходных реквизитов |
| `requestLogout` result | Клиентский adapter | HTTP успех/отказ; owned headers создаёт владелец уведомлений |
| `logout pending/error` | `features/auth/ui/LogoutButton/useLogout` | Один POST; success закрывает QuerySession и переходит на login |

После unmount активный запрос отменяется, завершившийся ответ не может обновить старую форму или управлять новой. Cookie и серверная сессия принадлежат существующим auth route/application/server модулям, здесь их формат не меняется. HTML-поля не сериализуют реквизиты нативно; логин требует гидратированного JS.
