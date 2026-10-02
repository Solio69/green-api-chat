# Contract: общая модель и кеш сообщений

**Owner**: 018 создаёт модель и ядро слияния для чтения; 019 добавляет подписку отображения и публичные функции для будущих производителей. 021/023/024 используют этот контракт, не создают второй кеш. Технический контракт подготовлен по согласованным spec; код разрешён пользователем 2026-10-02 в границах 019.

## Публичная модель

Путь типов: `src/lib/messages/types.ts`. Scope хранится в ключе Query, а не
копируется как секрет в каждое сообщение.

```typescript
type ProviderMessageStatus = 'delivered' | 'read' | 'failed' | 'noAccount'
type MessageDTO = {
  chatId: string
  idMessage: string
  direction: 'incoming' | 'outgoing'
  kind: 'text' | 'unsupported'
  text: string | null
  timestamp: number | null
  acceptedAt: number | null
  status: ProviderMessageStatus | 'accepted' | null
}
type MessageStatusFact = {
  chatId: string
  idMessage: string
  status: ProviderMessageStatus
}
type ChatIssueFact = {
  chatId: string | null
  idMessage: string | null
  code: 'failed' | 'noAccount'
}
type MessageApplyResult = { issues: ChatIssueFact[] }
```

chatId/idMessage — непустые строки; идентичность:
`connectionScope + chatId + idMessage`, без соединения строк неоднозначным
разделителем. В памяти используются вложенные записи либо безопасная
сериализация кортежа. Время поставщика — UNIX-секунды, безопасное целое ≥ 0.
`timestamp: null` означает отсутствие подтверждённого времени.
`acceptedAt` — локальные epoch-миллисекунды после успешного HTTP SendMessage
с idMessage; это не время поставщика. История и входящий текст ставят
acceptedAt: null. Текст сохраняет исходные пробелы/переносы, не HTML.
kind: unsupported имеет text: null; вложения и raw payload отсутствуют.
Никакой bubble не строится из одного status fact или предположения о тексте.

## Query и жизненный цикл

Основной ключ: `['messages', connectionScope, chatId]`, значение
`{ messages: MessageDTO[], contentSources?: Readonly<Record<string, MessageSource>> }`. Необязательный contentSources хранит источник содержимого по idMessage в той же записи; отдельного кеша нет. History-only запись совместима с прежней формой без этого поля. Отсутствующая запись отличима от записи с []:
успешный пустой ответ истории создаёт подтверждённую пустую запись; статус без
сообщения её не создаёт. Порядок сообщений — по известному timestamp × 1000,
либо acceptedAt для локально принятой отправки (оба сравниваются в
epoch-миллисекундах), затем idMessage для одинакового
времени. Неизвестное время сохраняет стабильный порядок первого появления.
acceptedAt не подменяет поле timestamp. Подтверждённый timestamp при дальнейшей
загрузке уточняет порядок; API-порядок не является гарантией.

Query defaults для этого префикса задаются ДО первого setQueryData:
gcTime: Infinity, enabled: false, retry: false, structuralSharing: false, queryFn: skipToken, без focus/reconnect,
interval и самопроизвольной загрузки. Это осознанное удержание согласованных
данных до session.close, не новое постоянное хранилище. Для списка 014
staleTime/gcTime и события обновления остаются прежними. При окончательном
unmount, выходе, 401 или смене подключения существующий close сначала скрывает
данные/деактивирует область, затем cancelQueries и clear. После close helper
ничего не создаёт. Клиентский scope включает expiry cookie; владение очередью
определяется инстансом отдельно.

Частичные ранние статусы: ключ `['message-status-facts', connectionScope]`,
значение содержит факты по chatId/idMessage и метаданные observedAt/sequence.
Хранятся максимум 1000 фактов на подключение, TTL 300000 ms с момента
фактического наблюдения. Очистка ленивая на чтении/применении, clock внедряемый;
при переполнении удаляется самый старый observedAt, равные значения — sequence.
Непрерывный timer не нужен. При повторе того же факта время не продлевается;
более сильный новый факт получает собственное observedAt. Если настоящее
сообщение уже есть, факт применяется сразу и не хранится как ранний. После
присоединения к сообщению подтверждённый статус не исчезает из-за TTL.

## Функции

`src/lib/messages/message-cache.ts`:

```typescript
applyMessageFacts({
  session, chatId, messages, statuses, source, now,
}: {
  session: QuerySession
  chatId: string
  messages?: MessageDTO[]
  statuses?: MessageStatusFact[]
  source: 'history' | 'live' | 'accepted'
  now?: () => number
}): MessageApplyResult

addAcceptedMessage({
  session, chatId, idMessage, text, acceptedAt,
}: {
  session: QuerySession
  chatId: string
  idMessage: string
  text: string
  acceptedAt: number
}): MessageApplyResult
```

Helper принимает только уже проверенные DTO текущей области; повторно проверяет
активность, chatId/identity и не допускает смешанной пачки чужих chatId.
Invalid DTO — ошибка применения, ACK не подтверждается. Все изменения
вычисляются чистым reducer в `src/lib/messages/merge-message-facts.ts`, затем
неизменяемо применяются синхронно через setQueryData; связанные записи
уведомляют React в notifyManager.batch. Внутри применения нет await между
чтением текущего кеша и записью. Query-backed факт одного сообщения — единственный
источник; компонент не копирует массив в useState.

addAcceptedMessage создаёт outgoing/text, timestamp: null, status: accepted,
с исходным текстом и acceptedAt. Он вызывается 021 только после подтверждённого
HTTP-успеха с idMessage и активного исходного scope; смена выбранного чата
не переадресует факт другому получателю. Реальный SendMessage в 019 не выполняется.

## Правила объединения

1. Одно idMessage в одном chatId/scope — одна запись; одинаковый текст разных id не схлопывается. Отсутствующий id не угадывается.
2. Новая история объединяется с ТЕКУЩИМ кешем, не со снимком до запроса. Отсутствие сообщения в последних десяти не означает удаление.
3. Подтверждённые provider-поля имеют приоритет над локальной accepted-записью. null не стирает известный timestamp/текст. History не перезаписывает уже известное live-содержимое устаревшим снимком; синхронизация редактирования/удаления не входит в объём.
4. Положительное подтверждение монотонно: read > delivered > accepted > отсутствие. История и повторная локальная вставка его не понижают.
5. failed/noAccount до delivered/read становятся ошибкой известного сообщения. После delivered/read сохраняется положительное подтверждение; результат helper содержит issue: {chatId,idMessage,code}. Если failure уже наблюдался, а затем приходит delivered/read, положительный статус также сохраняется и возвращается тот же issue. Два разных отказа сохраняют первый message failure и возвращают общий issue с новым наблюдавшимся кодом; отсутствие нового отказа не создаёт issue. 019 предоставляет publishMessageIssues, вызывающий слой применяет result сразу. 024 только отображает ошибки. Без противоречия возвращается issues: []. Helper не создаёт bubble и не удаляет сообщение.
6. Ранний статус присоединяется к фактическому сообщению независимо от порядка history/live/accepted. Без idMessage failed/noAccount передаются как общая ошибка чата/подключения по 023/024, а не этой функции.

Таблица отказов не считает accepted доставкой: failure→accepted/null сохраняет
failure без нового issue; accepted/null→failure сохраняет failure. Только
delivered/read является положительным подтверждением, которое при конфликте
с failure сохраняется вместе с issue. Повтор того же failure идемпотентен;
read→delivered сохраняет read без issue. Ранние partial facts используют ту же
таблицу; отказ с последующим подтверждением не теряется до attach.

Read hook: `useConversationMessages(chatId: string | null)` из
`src/lib/messages/use-conversation-messages.ts` возвращает
`{ data: MessageDTO[] | undefined }`, подписывается на нужный Query key и
session lifecycle. null/закрытая сессия дают undefined; успешная пустота даёт [].
Сам hook не запускает сеть. Применение SSE, статусные producers и ACK выполняются
только в отдельно разрешённых 023/024.

## Общие ошибки без вымышленного сообщения

019 создаёт `src/lib/messages/message-status-issues.ts`:

```typescript
publishMessageIssues({session, issues}: {
  session: QuerySession
  issues: ChatIssueFact[]
}): void
```

Merge противоречия возвращает ненулевые chatId/idMessage; отказ без id
использует nullable поля (unknown chat — issue подключения), а MessageStatusFact
по-прежнему требует обе строки и не создаёт bubble без идентичности.
Query key `['message-status-issues',connectionScope]`, gcTime: Infinity до
закрытия; по одному последнему issue для каждого chatId и один для подключения
(chatId:null). Нормализованная запись: `{chatId,idMessage:string|null,code}`.
Максимум одна connection запись и одна запись на известный chatId; это latest
состояние текущих чат-фактов, не неограниченный журнал повторов. При одинаковом
issue публикация идемпотентна; новый issue заменяет только issue
той же области чата/подключения. Отсутствие ошибки в истории не удаляет известный
issue. Это временный факт ошибки, не новое сообщение и не toast-журнал.
Активность/область/строковые ключи проверяются как у общего cache helper.
`src/lib/messages/use-message-issues.ts` предоставляет read-only
`useMessageIssues(chatId:string|null): {chat: MessageIssue|null,connection:MessageIssue|null}`;
null target не выбирает произвольный chat issue. Close скрывает и очищает данные.
019 расширяет существующий `src/lib/history/use-chat-history.ts`: после
успешного guarded merge текущего ответа он сразу передаёт returned issues в
publishMessageIssues. Проверки session/accessId остаются прежними; публикация
синхронна с обработкой результата, без дополнительной сети. Это расширение
после 018, поэтому 018 не импортирует ещё не созданный helper 019.
023 и 021 также вызывают publishMessageIssues сразу после apply/add, до ACK incoming;
некоррелированный failure передают тем же helper с idMessage:null и известным
chatId либо chatId:null для ошибки подключения. Hook/outlet 019 не создаёт
визуальный error сам: 024 подключает его отображение. Таким образом 023/021
компилируются без выполнения 024. Provider parser статуса принадлежит 022.

## Обязательные проверки

Дубли; одинаковый текст/разные id; accepted после history; ранний read перед
accepted; history после live; отсутствие сообщения в свежие десять сообщений; read→delivered;
противоречащий отказ; media placeholder; другой chat/scope; active=false;
отсутствие id; TTL/overflow c внедрённым временем и без реального ожидания;
GC удержание до close, очистка после close. Изолированные проверки Passed; подробности в [verification](../verification.md). Реальные producers и совместный SC-005 — NotRunExternal.

## Подтверждённые детали реализации

Подтверждённые provider-данные заменяют локальную accepted-запись; первый известный provider-текст сохраняется. Обработка редактирований не входит в объём; timestamp:null
не превращает live в локальную отправку. Необязательные contentSources нужны
для этого случая, а не для второй копии MessageDTO. Значения и ключи записываются
неизменяемо. Memory defaults отключают structuralSharing, чтобы replaceEqualDeep
Query 5.104.0 не терял own-ключ `__proto__` в непрозрачных строковых идентификаторах.
Это подтверждено поведением теста overlay; политика сетевого GetChats не меняется.
