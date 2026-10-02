# Contract: общий контроллер одной отправки

Владелец: 021. Публичные экспорты MessageSendProvider/useMessageSend из
src/components/MessageSendProvider/index.ts. Provider находится в живом
workspace внутри ConversationSelectionProvider и владельца уведомлений,
вне условной ConversationPane. Изоляция — текущая QuerySession.

## Публичный hook

useMessageSend() возвращает pendingAttempt:null|PendingAttempt,
lastResult:null|AttemptResult, send({target,text,selectionEpoch,editorRevision}),
clearResult(). target:{chatId,label}; send возвращает Promise<AttemptResult|null>.
null означает действие не начато (pending/nonowner/closed/invalid local text),
не подтверждённую отмену внешнего сообщения. Не использовать hook вне provider.
Публичные PendingAttempt/lastResult не включают ownerCapability: proof
захватывается отдельно внутри provider/transport и не выводится потребителями.
AttemptResult — accepted с AcceptedSend+snapshot без proof либо error с
code/httpStatus/outcome+тем же snapshot; записи чужого scope/lifetime нет.

Один useMutation с mutationFn/fetchSendMessage, retry:false,
networkMode:'always', gcTime:0. Не применять mutation scope queue/persistence.
Синхронный ref latch устанавливается до вызова mutateAsync; его активность
отражается в React-состоянии. Пока занят, новый send не вызывается.

## Внутренний owner context 023

OwnerContext из src/lib/notifications/types.ts содержит connectionScope:string,
ownerEpoch:string (opaque epoch), ownerCapability:string. Controller 023
предоставляет captureOwnerContext():OwnerContext|null и
isCurrentOwnerContext(context:OwnerContext):boolean. Capture захватывает matching
owner текущей активной QuerySession, пока он retained (attached или 10s grace);
null при expiry/revoke/replacement/close. Snapshot закрыт внутри send provider,
не входит в PendingAttempt/lastResult, UI props, storage или logs.

MessageSendProvider получает внутренний OwnerAccess через useNotificationOwner()
из src/components/NotificationProvider/index.ts: captureOwnerContext,
isCurrentOwnerContext, getOwnerHeaders, getOwnedHeaders. Hook требует provider;
это закрытый bridge для send/logout integration, не UI hook состояния.
Публичный useNotificationConnection() по-прежнему отдаёт только
{status,canSend,retry,issue}; capability не добавляется в этот DTO.

До начала запроса Send одновременно проверяет UI canSend===true и ненулевой
captureOwnerContext(), затем устанавливает local latch без await между проверкой
и захватом. Client guard не заменяет server tryAcquireSend. Для публикации уже
начатого результата используется isCurrentOwnerContext(snapshot): проверяются
активная QuerySession, scope, capability и epoch; attached/canSend не требуются.
Ни selectionEpoch, ни chatId, ни публичный status не заменяют этот owner guard.

При завершении provider, а не компонентный mutate callback, выполняет:

1. Вызывает isCurrentOwnerContext(capturedOwnerContext) из 023:
   проверяет активность исходной session и сохранение исходного capability/epoch,
   а не флаг canSend/live SSE. При временном disconnect в пределах grace тот же
   owner сохраняется: ранее начатый accepted HTTP-результат применяется к своему
   чату даже при canSend:false. Только закрытая session, другой scope или
   отозванный/заменённый owner lifetime исключают публикацию. Смена выбранного
   чата сама по себе не закрывает session.
2. При valid accepted применяет addAcceptedMessage({session,chatId,idMessage,
   text,acceptedAt:Date.now()}) и rememberPersonalChat({session,chatId,label,
   source:'accepted'}) из 019. Данные относятся к snapshot, не current target.
   addAcceptedMessage возвращает MessageApplyResult:{issues:ChatIssueFact[]}.
   Все returned issues передаются publishMessageIssues({session,issues}) из
   src/lib/messages/message-status-issues.ts (core 019), обычно массив пуст.
   Нет условного drop до UI-024 или собственной классификации конфликтов.
3. Сохраняет результат с snapshot для актуальной формы; форма очищает только
   совпадающий editorRevision/selectionEpoch, не чужой текст.
4. Освобождает local latch в finally. Это не release server lock: сервер
   самостоятельно держит его до settlement, даже если browser HTTP оборван.

## Клиентский транспорт

src/lib/sending/fetch-send-message.ts экспортирует
fetchSendMessage({session,target,text,attemptId,ownerCapability,fetcher?})
→ Promise<AcceptedSend>. Ошибка — SendMessageError extends SessionQueryError
с code/status/outcome, без текста сообщения и proof. Hook преобразует ошибку
в AttemptResult для текущего snapshot. POST /api/messages с cookie, JSON только
chatId/message/attemptId, X-Connection-Scope и X-Chat-Owner, cache:no-store.
Нет browser retries, offline queue, token в URL или body. Payload валидируется
как unknown: status/code/outcome, строковые IDs, совпадение scope/chatId/attemptId.
accepted только при HTTP200 + valid DTO. Невалидный/чужой accepted после dispatch
не записывается в Query и консервативно имеет unknown (foreign scope отдельно
закрывает актуальное неверное подключение по connection_changed контракту).

Normalized SessionQueryError для 401 session_required и 409 connection_changed
передаётся session.handleSessionError один раз; not_owner/receiver_not_active/
send_in_progress 409 не session failure. Поле не становится failed из-за SSE
ошибки; фактические статусы определяет 024.

## Ошибка и отмена

Browser network/read/parse failure после явного dispatch — unknown и no retry.
До dispatch закрытая сессия/неактивный owner/локальная валидация — not_sent.
Unmount pane не отменяет попытку; close/logout запрещают новый dispatch и
игнорируют поздние записи. CancelQueries не гарантирует cancel SendMessage.
Потеря owner proof отзывает доступ к рабочему чату, не присваивает старой
попытке новый owner и не отправляет повтор автоматически.
Временный reconnect с сохранением исходного proof/epoch — другой случай:
он запрещает новый dispatch, но не стирает уже полученное принятие HTTP.

## Общие контракты

- [Сервер 020](../../020-send-message-api/contracts/send-api.md).
- [Message cache 019](../../019-chat-history-window/contracts/message-cache.md).
- [Session chat facts 019](../../019-chat-history-window/contracts/session-chat-overlay.md).
- [Владелец 023](../../023-notification-sse/contracts/notification-http.md).
- [Owner context API 023](../../023-notification-sse/contracts/notification-client.md).
- [Выбор 025](../../025-conversation-selection/spec.md).

Нормализованная ошибка/cleanup lifecycle расширяется в 018; этот контроллер
использует её, не создаёт второй независимый router handler или QueryClient.
