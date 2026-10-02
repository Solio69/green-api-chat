# Data Model: история выбранного чата и кеш

**Статус**: implemented, isolated checks Passed; спецификация согласована 2026-10-02, код разрешён пользователем 2026-10-02 в границах 019.

## Источники истины

[MessageDTO/merge/early status/issues](contracts/message-cache.md) — единственная
нормативная модель 019/018/021/023/024. Fields и точные signatures не дублируются
здесь. Message identity — connectionScope/chatId/idMessage. Scope содержит
expiry cookie, не раскрывает токен. timestamp провайдера и локальное acceptedAt
имеют разную семантику и единицы; сравнение порядка переводит секунды в ms.

| Запись                   | Ключ/владелец                                    | Жизненный цикл                                                 |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------- |
| Snapshot запроса         | chat-history-request + scope/chatId/accessId,018 | gcTime: 0 после последнего observer; fresh каждый новый access |
| Объединённые сообщения   | messages + scope/chatId,018→019                  | До close; неизвестная запись ≠ успешный []                     |
| Ранние частичные статусы | message-status-facts + scope,019                 | Lazy TTL 300000/max 1000; attach в настоящий message           |
| Общие issues             | message-status-issues + scope,019                | Последний issue на чат и подключение, до close                 |
| Provider список          | chats + scope,014                                | Прежние stale/gc/refetch                                       |
| Session чат/подпись      | session-chats + scope,019                        | Факт до provider подтверждения; label до close                 |
| Target/access/mobile     | Context 025                                      | Scope unmount/close; мобильный возврат сохраняет выбор         |

## Применение и представление

Snapshot 018 объединяется с текущими сообщениями, включая поступившее между
запросом и ответом. Успешный пустой ответ подтверждает [] только при отсутствии
известного, а ошибка не меняет известную историю. Idempotent merge не схлопывает
одинаковый текст разных id. Позднее чтение не удаляет live message и не понижает
delivered/read. Отсутствующий timestamp не превращается в provider time.

Read hooks подписываются на Query и active lifecycle; компоненты не ведут
вторые массивы или собственные maps сообщений. Status-only хранит факт и не
создаёт сообщение. Противоречие returns issue; общий helper публикует его в
scoped Query, а визуальное представление будет 024. Неугадываемый отказ без id
публикуется общей ошибкой, не связывается с текстом последней отправки.

Overlay определён [отдельным контрактом](contracts/session-chat-overlay.md).
GetChats DTO остаётся PersonalChat; label отдельно от фактического профиля.
Accepted/incoming факт сохраняется при пустом/error refresh и поглощается
подтверждённым provider chatId. Это не новая запись Telegram и не база.
После close все memory helpers inert; очистка не создаёт данные повторно.

## UI

[Контракт отображения](contracts/history-view.md) отделяет waiting/empty/error
от merged data; текст безопасен, media placeholder и общий scroll без
pagination. Panel не управляет target, back/close или черновиком. Только
согласованные UI-012/UI-014/UI-016, direction/time; status indicators позже 024.

## Валидация

Provider payload нормализуется до MessageDTO server-side 018/022. Нет raw
attachment/url/secret/profile в message. Клиент helper ещё проверяет active,
identity и принадлежность chatId. Некорректная пачка — явная ошибка применения,
не ACK success. Строковые keys используют безопасные tuple/maps, без
prototype pollution. TTL/overflow проверяются injected time; никаких timers
для обучения и скрытого общего hardcap истории.

В основной MessageCache необязательный contentSources хранит подтверждённый источник по idMessage, включая отсутствие timestamp. Provider-данные заменяют accepted-текст; уже известный provider-текст сохраняется, поскольку обработка редактирований не входит в объём. Он находится в той же записи messages. Memory-префиксы имеют structuralSharing:false для сохранения безопасных own-ключей Record; сетевые настройки GetChats прежние. Подтверждение: [verification](verification.md).
