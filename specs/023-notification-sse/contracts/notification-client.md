# Клиент обработки уведомлений

**Проверки**: NotRun. Контракты [HTTP](notification-http.md), [SSE](sse-stream.md), [Query session018](../../018-chat-history-console/contracts/history-query.md), [message-cache019](../../019-chat-history-window/contracts/message-cache.md), [chat overlay019](../../019-chat-history-window/contracts/session-chat-overlay.md).

`src/components/NotificationProvider/NotificationProvider.tsx` один раз под существующим QueryProvider вокруг ChatWorkspace; page.tsx сохраняет server-rendered slots. Подписка не зависит от selectedChatId. SelectionProvider025 остаётся внутри workspace; форма 021 получает `useNotificationConnection()` с `{status,canSend,retry,issue}`. status: claiming/connecting/connected/retrying/limited/paused/closed. canSend только healthy attached connected; backend020 повторно проверяет server ownership.

`src/lib/notifications/create-notification-connection.ts` создаёт один controller текущей QuerySession. Capability закрыто в controller; внутренний `getOwnerHeaders()` возвращает snapshot scoped headers для Send021 или null при !canSend, capability не публикуется в UI props/журналах. Для logout внутренний `getOwnedHeaders()` предоставляет matching headers даже при grace/pause, пока capability ещё существует; отсутствие canSend не означает потерю возможности отозвать своё право. Send captured context повторно проверяет session active перед эффектом. Controller использует существующий retain/release lifecycle так, чтобы React StrictMode cleanup/remount не создавал новый claim или одновременные streams. Блок scopes не заменяется глобальным singleton browser со всеми подключениями.

Начало: claim → stream → ready matching scope/epoch → connected. После разрыва прекратить canSend, abort старого request; при поддержанной grace повторить stream с прежним cap, иначе явно потерять старое право и claim. Базовые delays1,2,4,8,10 сек, random multiplier[0.8,1];30 сек без валидного frame даёт abort/reconnect. Ownership busy/not_owner не вызывает автоперехват: limited и explicit retry пользователя; auth401/409connection_changed делегируется SessionQueryError018, остальное не logout. Paused malformed/config/delete требует explicit retry после исправления; не tight reconnect.

После каждой recovery ready сигнализировать выбранному чату 025/019 обновление свежих count 10, не clear messages. Контракт `subscribeRecovery(listener)` даёт событие только после восстановления, не каждого heartbeat; начальную загрузку даёт выбор 019. listener не отменяет receive, не держит ACK до history. Без выбранного чата историю не запрашивать. Старый scope/generation delivery полностью отвергается до merge/ACK.

Применение одного notification:

1. Проверить scope/epoch/delivery/schema и текущую активность.
2. Incoming: `applyMessageFacts`019 source live для event.chatId, returned `issues` опубликовать через `publishMessageIssues`, затем `rememberPersonalChat({session,chatId,label:displayLabel,source:'incoming'})`019; не переключать выбранный B. Известный unsupported — нейтральный MessageDTO.
3. Status: Если wire ProviderStatusFact имеет полные chatId/idMessage, преобразовать в MessageStatusFact019 (timestamp не часть shared status identity) и применить `applyMessageFacts({session,chatId,statuses:[fact],source:'live'})`; `publishMessageIssues({session,issues})` публикует returned issues, а отказ без id — `publishMessageIssues({session,issues:[{chatId,idMessage:null,code}]})`; ранний partial fact не создаёт текстовый пузырь.
4. Валидный ignored: осознанный no-op. Повтор уже применённого факта — успешное идемпотентное применение.
5. После успешных синхронных преобразований отправить ACK `{deliveryId}`. Async GetChats/history не является prerequisite ACK. При исключении применения/invalid payload — pause/noACK, не false success.

GetChats уточнение overlay идет через существующий useChats/query key014, без смены staleTime/refetchOnWindowFocus. За одно подключение коалесцировать incoming-triggered invalidations и не инициировать GET чаще 1/сек; pending request не запускает второй. Последний invalidation после серии не теряется. Ошибка/отсутствие чата не удаляет overlay или сообщения; существующие auth правила 018 всё равно завершат scope. Actual label fallback chatId, ни фото ни искусственный PersonalChat.name не создавать.

ACK lost/transport error допускает retry только текущего delivery с cap при active stream; backoff такой же, new delivery отменяет старую попытку. После replay приложение фактов идемпотентно; клиент не хранит безграничный журнал deliveryIds. max один in-flight ACK; late response не оживляет session. ACK200 значит server accepted, не provider delete/durable save. delivery_changed прекращает устаревший ACK, не logout. Старый stream close handler generation-guarded.

QuerySession close сначала вызывает зарегистрированный resource cleanup controller: abort stream/ACK/reconnect timers и перестать merge, очистить cap/owner refs; best-effort matching release starts, но cookie может быть уже удалена; его успех не гарантируется, missing release покрывают server grace/expiry. Public018 `registerCleanup(callback:()=>void):()=>void`; регистрация после close немедленно вызывает cleanup, ошибки callback изолированы; все close источники используют один API; close active=false → synchronous cleanup callbacks → subscribers → cancelQueries → clear, callback errors изолированы. beforeunload/sendBeacon не является механизмом гарантированного release, потому что custom owner/scope headers необходимы. Query scope memory исчезает по существующему lifecycle. Код реализации сейчас не разрешён.

LogoutButton использует optional NotificationProvider hook: если controller владеет capability, добавить X-Chat-Owner/X-Connection-Scope к существующему POSTlogout; server отзывает только проверенный matching owner. Инактивная вкладка без cap не может explicit release другой вкладки. End-session GET без cap удаляет cookie, не обходит ownershipguard. Не гарантировать успех best-effort release после удаления cookie; server grace/expiry покрывают отсутствие release.

Issue cache/key и baseline reducer реализованы 019;023 применяет их до ACK, а наблюдаемые status/error outlets024 могут ещё быть NotRun. Это сознательная граница маленьких последовательных шагов, не потеря событий/ошибок.

Внутренние методы controller: `getOwnerHeaders():Readonly<Record<string,string>>|null` только при canSend; `getOwnedHeaders():Readonly<Record<string,string>>|null` для собственного logout/release, пока owner capability существует. Оба возвращают X-Connection-Scope и X-Chat-Owner; snapshot не сохранять в UI state/URL/storage. `subscribeRecovery(listener:()=>void):()=>void` — событие после восстановления;019ChatHistoryPanel читает текущий selectedChatId через025 и запускает019refetch только если он есть.

## Internal owner API для021

Тип из src/lib/notifications/types.ts:

```ts
type OwnerContext = {
  connectionScope: string
  ownerEpoch: string
  ownerCapability: string
}
```

Controller.captureOwnerContext():OwnerContext|null возвращает snapshot только существующего retained owner текущей active QuerySession; attached/grace допустимы. Controller.isCurrentOwnerContext(context):boolean проверяет session.isActive, matching scope/capability/epoch и отсутствие revoke/истёкшего grace, не требует canSend или attached SSE. Grace timeout 10 сек очищает capability/epoch; close/revoke делает проверку false. Начало нового Send021 требует одновременно canSend и matching capture; уже начатый accepted result публикуется по isCurrentOwnerContext, даже если canSend=false при retained grace. Snapshot не попадает в публичные props/pending/results/logs/storage.

NotificationProvider/index.ts экспортирует внутренний useNotificationOwner():OwnerAccess с captureOwnerContext/isCurrentOwnerContext/getOwnerHeaders/getOwnedHeaders/subscribeRecovery; useOptionalNotificationOwner():OwnerAccess|null нужен LogoutButton без обязательного Provider. Public useNotificationConnection возвращает только status/canSend/retry/issue; useOptionalNotificationConnection():publicState|null нужен018 standalone fixtures. Все helpers используют одну controller, не создают новую ownership.

## Recovery consumer018

NotificationProvider снаружи Workspace не читает вложенный SelectionContext.023 расширяет src/components/ChatHistoryPanel/ChatHistoryPanel.tsx: useOptionalNotificationOwner() и subscribeRecovery; callback читает текущий target025 через existing SelectionProvider, вызывает текущий useChatHistory.refetch только при выбранном chatId и active scope. Pending refetch coalesces018, count10 и samekey/generation guards сохраняются; listener не удерживает ACK. unsubscribe на cleanup.025 не импортирует будущую023, slot создан025, ChatHistoryPanel реализован019. На initial ready сеть отдельно не запускается: выбор018 сам даёт первую fresh10; recovery refresh относится к восстановлению.
