# Contract: передача слоя данных задаче UI

Статус: 014 реализована и проверена; публичные экспорты готовы. Каркас/поиск сохранены, видимый список подключён в 015. FR-008, FR-013–FR-016.

014 предоставляет QueryProvider, PersonalChat, ChatsQueryError и useChats согласно [query-layer.md](query-layer.md). Потребитель — Client Component внутри authorized provider. Серверная шапка продолжает получать профиль из GetAccountSettings. UI не импортирует серверный адаптер, session или get-query-scope.

```typescript
import { useChats } from '@/lib/chats/use-chats'
import type { PersonalChat } from '@/lib/chats/types'
```

Порядок интеграции: сначала доступен проверенный слой 014; затем задача UI подключает useChats в собственном ChatList. data undefined означает отсутствие результата; [] означает успешный пустой список. При data + isFetching показывать обновление, при data + error сохранять список и дать повтор. Подпись выбирается из реально полученных name/username/phone/chatId. Фото, превью и время не добавляются из фиктивных данных. selectedChatId остаётся состоянием интерфейса. История и уведомления не считаются реализованными.

| Точка                                        | 014                                                                                            | UI-задачи                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| src/app/page.tsx                             | Только provider/key/scope вокруг authorized content                                            | Каркас и новые компоненты внутри provider |
| src/components/LogoutButton/LogoutButton.tsx | Очистка после успешного HTTP и nullable context                                                | Стили/положение/доступная подпись         |
| src/lib/routes/constants.ts                  | CHATS_API                                                                                      | Без независимого дублирования пути        |
| src/lib/api/constants.ts                     | CONNECTION_CHANGED                                                                             | UI читает нормализованный code            |
| src/lib/http/constants.ts                    | Заголовок scope, если нет подходящего ключа                                                    | Не меняет серверный протокол              |
| src/lib/green-api/constants.ts               | CHATS_METHOD                                                                                   | UI не импортирует серверные constants     |
| tests/e2e/fixtures/fake-green-api.ts         | Добавление getChats, сохранение остальных веток                                                | UI использует подтверждённые fixtures     |
| package.json / eslint.config.mjs             | test:query и узкий ignore генерируемого fixture output; зависимость устанавливает пользователь | Не перезаписывает конфигурацию            |

Прямые пересечения относятся также к пользовательским текущим staged изменениям. Перед каждой записью сверить актуальный diff и повторно прочитать файл. Если соседний агент меняет ту же строку/область, сначала согласовать очередность с пользователем или по уже разрешённому каналу; не заменять его версию своей сохранённой копией. Не менять SCSS, дизайн формы поиска, корневой layout и профиль в 014. Сообщение другому агенту этим документом не отправлено.

Слой можно принять через fixture тесты без готового продуктового ChatList. Итоговый статус должен явно разделить «API/hook готов» и «UI интегрирован/ещё не интегрирован».

## Проверенная точка после редизайна

2026-10-02: соседний чат завершил текущую реализацию 015/016. Главная содержит ChatWorkspace с server slots account/search/chatList; chatList содержит ChatListPanel/ChatList из 015. В 014 provider/key/scope оборачивает этот актуальный ChatWorkspace, не заменяет его разметку и не создаёт ChatListPanel/ChatList. Представление списка принадлежит 015 и использует готовый useChats. LogoutButton сохраняет текущие SVG/тексты/форму; добавляется только lifecycle после HTTP ok. Исполняемые useChats/QueryProvider готовы и проверены на реальном React стенде, Query 5.104.0 установлена пользователем. Интеграция ChatListPanel/ChatList выполнена в 015; результаты — [015 verification](../../015-chat-workspace-ui/verification.md).
