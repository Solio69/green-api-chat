# Реальные статусы сообщения

**Проверки**: PassedSynthetic; Operator NotRun. Source of truth общей модели/памяти: [019 message-cache](../../019-chat-history-window/contracts/message-cache.md). Транспорт: [023](../../023-notification-sse/contracts/sse-stream.md).

```ts
type ProviderStatusFact = {
  chatId: string | null
  idMessage: string | null
  status: 'delivered' | 'read' | 'failed' | 'noAccount'
  timestamp: number | null
}
```

connectionScope задаёт outer authenticated delivery, не provider body. message id — непустая строка без number cast; chatId проверенный личный id или null для допустимой общей ошибки без надёжного chat correlation. For delivered/read оба id/chat обязательны. For failed/noAccount официальный payload может не иметь idMessage: это допустимый отказ, general issue. Если имеется idMessage без надёжного chatId, не угадывать чат по текущему выбору/последней отправке; general connection issue, без ошибочного обновления пузыря. Provider description не пересылается: заранее заданные общие тексты failed/noAccount, без raw/phone/url. noAccount не утверждает точное отсутствие аккаунта, возможно скрытие приватностью.

022 реализует `src/lib/notifications/normalize-message-status.ts`, который валидирует unknown provider body после envelope022. Неизвестный строковый status с валидным envelope — ignored по Q-REC-05, не invented sent/delivered/failed. Неверные типы/повреждённый known success status — malformed/noACK. Все failed/noAccount корректные события обрабатываются независимо от переключателей outgoing; настройки не используются как filter.

019 реализует `src/lib/messages/merge-message-facts.ts` — чистый reducer объединения фактов, используемый общим cache019, не отдельный массив bubbles. Incoming message никогда не получает outgoing статус. Общие query keys/helper names/import paths определяет 019; status mapper не создаёт своё persistence.

| Уже известен статус | Новое подтверждение                | Результат                                                                                      |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| null/accepted       | delivered/read                     | Новое подтверждение                                                                            |
| delivered           | read                               | read                                                                                           |
| read                | delivered/accepted/null            | read, без понижения                                                                            |
| delivered/read      | failed/noAccount                   | Сохранить подтверждённый success; общая ошибка чата с наблюдавшимся failure code               |
| failed/noAccount    | delivered/read                     | Сохранить подтверждённый более сильный success; общая ошибка чата с наблюдавшимся failure code |
| null/accepted       | failed/noAccount с полной identity | Сопоставленный отказ                                                                           |
| Любой               | Точный повтор                      | Идемпотентно, без нового сообщения                                                             |
| failed              | noAccount или наоборот             | Первый известный failure сохраняется; общая ошибка чата с новым наблюдавшимся failure code     |

Не делать логическое заключение из timestamp, что failure отменяет read; provider не гарантирует такой causal order. История/HTTP acceptance всегда слабее фактического live confirmed success и не стирает live факт. HTTP outcome_unknown020 не становится failed от отсутствия уведомления и не разрешает retry.

Статус до фактического сообщения сохраняется как частичный факт по `(scope,chatId,idMessage)`. Canonical019 key: `['message-status-facts', connectionScope]`; observedAt — локальные epoch ms через внедряемый `now:()=>number`, sequence — порядок наблюдения. TTL 300000 ms, максимум 1000 фактов: lazy prune перед чтением/применением, при переполнении удаляется минимальный observedAt, затем sequence. Непрерывный timer не нужен. Точный повтор не продлевает TTL, действительно новое более сильное подтверждение получает новый observedAt. После присоединения к реальному исходящему MessageDTO статус живёт вместе с ним до scope close, TTL больше его не удаляет. Это технический предел памяти, не retention провайдера; expiry/eviction не создают пузырь и не обещают полный recovery.

failed/noAccount без idMessage хранится как latest safe general issue соответствующего чата либо подключения. Повторы не копят массив raw errors. Notification processing/ignore/conflict завершается успешно и разрешает ACK; invalid payload не ACK. Не отправлять снова, не вызывать ReadChat/SetSettings/GetMessage для догадки. UI010/019/021 использует статические labels «Принято API», «Доставлено», «Прочитано», «Ошибка отправки», «Получатель недоступен» в текущем месте статуса, без новой компоновки/пузыря; общая ошибка находится в существующем error outlet чата/подключения.

## Публикация общей ошибки

019 предоставляет `src/lib/messages/message-status-issues.ts`: Один helper `publishMessageIssues({session,issues:ChatIssueFact[]})`; некоррелированный отказ передаёт `issues:[{chatId,idMessage:null,code}]`. `MessageApplyResult={issues:ChatIssueFact[]}` возвращается applyMessageFacts/addAcceptedMessage. `ChatIssueFact={chatId:string|null,idMessage:string|null,code:'failed'|'noAccount'}`. Merge возвращает полную identity, general failure допускает null.023 и 021 публикуют result, не теряют его молча и не создают bubble. Latest issue хранится по chat либо connection в памяти scope; repeated event не копит raw errors.024 читает эти данные для существующего status/error outlet.

Реализационная зависимость:025→018→019→020 core→022→023→020 HTTP→021→024. Сохранение обработанной ошибки в 019/023 доступно раньше 024; полноценное видимое отображение входит в 024, не заявляется готовым в предшествующем частичном шаге.

019 read-only hook `useMessageIssues(chatId:string|null):{chat:MessageIssue|null,connection:MessageIssue|null}` из `src/lib/messages/use-message-issues.ts` даёт latest issue; Query key `['message-status-issues',connectionScope]`, gcTime:Infinity до close.024 добавляет MessageStatusIndicator в optional status slot MessageBubble и MessageStatusIssue в error outlet ChatHistoryPanel/workspace; MessageList передаёт status prop. Новый layout/style redesign не входит. Knowntext/profile не дополняется по guessed id.
