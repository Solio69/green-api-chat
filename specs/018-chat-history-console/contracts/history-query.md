# Contract: чтение истории, событие выбора и lifecycle

## QuerySession

`src/lib/query/create-query-session.ts` сохраняет client/isActive/subscribe/
close/retain/options 014; добавляет неизменяемое connectionScope, общий
handleSessionError(error: SessionQueryError): Promise<void> и
registerCleanup(callback: () => void): () => void.
SessionQueryError в `src/lib/query/session-query-error.ts` содержит code:string,
status:number|null. ChatsQueryError и HistoryQueryError наследуются от него,
сохраняя доменные имена/публичный API. QueryCache.onError и SSE/mutation callers
делегируют единому handler только проверенные нормализованные ошибки.

Закрытие выполняется один раз: active=false → все cleanup callbacks синхронно
и с изоляцией их исключений → lifecycle subscribers скрывают данные →
cancelQueries → clear. Обработчик 401 session_required вызывает прежнюю
replace('/login')+refresh, 409 connection_changed — только refresh текущего
серверного контекста. Любой иной 409, включая конфликт рабочей вкладки, не
завершает Query-сессию. Несколько ошибок не умножают навигации. registerCleanup
после close сразу вызывает callback и не возвращает право создать ресурс.
Cleanup callback запускает abort/очистку памяти, не обещает await HTTP-release
после уже удалённой cookie. Серверные leases принадлежат 022/023.

StrictMode retain/setup→cleanup→setup и окончательный unmount сохраняют контракт
014: replay не уничтожает действующий экземпляр, настоящий выход закрывает
его немедленно. Провайдер остаётся keyed по connectionScope, включая expiry.
025 не зависит от новых методов — использует прежние isActive/subscribe/key.

## История

Публичный `useChatHistory(chatId: string | null)` из
`src/lib/history/use-chat-history.ts` возвращает:

```typescript
type HistoryState = {
  data: MessageDTO[] | undefined
  isPending: boolean
  isFetching: boolean
  error: HistoryQueryError | null
  refetch: () => Promise<void>
}
```

Аргумент должен совпадать с текущим target.chatId из
useConversationSelection 025; accessId берётся из того же контекста. Никаких
самостоятельных выбранных чатов в истории. null/чужой выбранному chatId или
closed session дают data:undefined, оба флага false/error:null и refetch без сети.
Мобильное «Чаты» сохраняет target/accessId: нового запроса нет. Повторное
openConversation, включая тот же чат, увеличивает accessId и даёт свежий запрос.
Закрытие снимает выбор, отменяет прежнее чтение, но сохраняет известные сообщения
до завершения подключения. selectionEpoch используется формой 021, не вместо
accessId истории.

Временный network key:
`['chat-history-request',connectionScope,chatId,accessId]`. staleTime: Infinity
для ОДНОГО обращения, gcTime: 0 после снятия последнего наблюдателя, retry: false,
refetchOnMount/focus/reconnect/interval:false; enabled только для active/current
selection. Новое accessId всегда означает другой ключ и новый HTTP запрос.
Это не переиспользование старой истории вместо свежей: Infinity действует лишь
для дедупликации нескольких подписчиков одного события открытия.

queryFn читает [API](history-api.md), проверяет status/code/shape/scope/chatId,
signal и active после fetch и JSON. Возвращает свежий snapshot. После успешного
чтения только текущий accessId может применить snapshot неизменяемым updater
к [общему кешу](../../019-chat-history-window/contracts/message-cache.md).
Поздний A после B либо первого A после A→B→A не применяется как новое обращение.
Загрузка не заменяет сообщения снимком: updater читает текущий кеш, включая
события, пришедшие во время запроса. Компоненты подписываются на merged key,
snapshot хранится лишь в наблюдаемой request query, а не в useState.

data — известная объединённая история. Она может быть больше десяти.
isPending — request query ещё не получила успешный результат и находится в
pending; это независимо от наличия merged данных. Уже пришедший live message
можно показывать, но он не объявляет историю успешно загруженной. isFetching —
текущий сетевой запрос. Ошибка сохраняет известные данные и отражается отдельно.
Нельзя подставить [] до успешного чтения или выдать пустой новый snapshot за
пустоту известной истории. refetch — ручное чтение для активного текущего чата,
если его запрос ещё не выполняется; Promise не выбрасывает ожидаемую API-ошибку,
она доступна в error. Новые retries/refresh не используют текст для сопоставления
неопределённой отправки. Новое выполнение не публикует поздний результат отменённого.

## Консоль 018

`ChatHistoryController` — невидимый клиентский компонент под SelectionProvider
и QueryProvider, в существующем conversation slot главной страницы. Он наблюдает useChatHistory и один
раз публикует свежий snapshot/ошибку завершённого текущего чтения, с chatId и
count: 10. Несколько consumers/StrictMode не умножают лог одного результата.
Успешный ручной повтор имеет свой результат, но повторный render того же ответа
не печатает его повторно. Controller подписывается непосредственно на QueryCache
актуального request key и завершения запроса (success/error action либо изменения
dataUpdateCount/errorUpdateCount). Он читает свежий snapshot/ошибку из request query,
а не из HistoryState.data. Дедупликация использует key и счётчики соответствующего
завершения. После подписки проверяется уже завершённое состояние текущей query,
чтобы не потерять ответ, полученный до mount. Закрытая область/старое accessId и
отмена не логируются как новая ошибка. Подписка удаляется при cleanup.
Не полагаемся на React rerender, isFetching, время или ссылку массива: при
structuralSharing и завершении в том же tick они могут остаться прежними.
Одинаковый JSON нового ответа всё равно является свежим чтением. Дополнительных
публичных методов, компонентов и сетевых запросов это не создаёт.
Merged data не выдаются за свежий snapshot. Закрытие/смена области/выбора
подавляют прежний вывод. Нормализованная ошибка не содержит raw provider details.
Это диагностический результат, прямо запрошенный пользователем, без сохранения
реальной переписки в тестовые артефакты и документы.

## Проверки

Два consumers одного accessId → один HTTP; новое открытие → новый HTTP;
A→B→A и одинаковые ответы в одном tick при structuralSharing; cache empty/error vs snapshot; ручной повтор;
refetch при pending/null/close; мобильный возврат/close; late reply после logout;
401/409 нормализованные vs ownership409; thrown cleanup/late cleanup;
StrictMode replay; неизменная политика и публичные импорты 014. Фактические результаты приведены в verification.md.

Контроллер возвращает null: слот не добавляет интерфейс истории. Мобильный
возврат сохраняет его mounted вместе с Pane; закрытие снимает observer и отменяет
чтение. ChatWorkspace и fixture 025 не запускают запросы истории самостоятельно.
Подписки QueryCache устанавливаются через useLayoutEffect и снимаются при
commit нового accessId, чтобы позднее completion не применялось прежним listener.
Дедупликация console использует WeakMap по объекту request Query и счётчики
успешных/ошибочных завершений: она общая для consumers, а удалённый Query не
удерживается отдельным журналом.
