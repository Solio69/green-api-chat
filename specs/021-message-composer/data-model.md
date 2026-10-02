# Data model: текущий ввод и попытка

**Статус**: техническая подготовка; durable storage отсутствует.

Dispatch требует active attached SSE; публикация результата требует сохранения
исходного scope/capability/epoch, а не attached-флага. Grace disconnect при
сохранённом владельце допускает применение уже начатого accepted HTTP-результата;
revoked/replaced owner или closed session — исключают. Это две разные проверки.

| Сущность       | Поля                                                                  | Жизненный цикл                                             |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Current editor | text:string, editorRevision:number                                    | Текущая выбранная переписка; clear на смену/close          |
| Target         | chatId,label + selectionEpoch из 025                                  | Один выбор; mobile «Чаты» сохраняет                        |
| PendingAttempt | attemptId, scope, chatId, label, text, selectionEpoch, editorRevision | Одна попытка на подключение; provider вне conditional pane |
| Attempt result | AcceptedSend либо SendFailure из 020 + snapshot попытки               | Без самостоятельной коллекции сообщений                    |

attemptId — UUID корреляции; ownerCapability захватывается отдельно как закрытый
transport context и не включается в публичный PendingAttempt/lastResult.
Это секрет в памяти вкладки из 023,
не выводится в URL, DOM/data attributes, logs или persisted state. Все актуальные
проверки используют isActive и текущий owner lifetime; scope не является proof.
Закрытый OwnerContext из src/lib/notifications/types.ts содержит
connectionScope:string, ownerEpoch:string, ownerCapability:string;
captureOwnerContext()/isCurrentOwnerContext() принадлежат controller 023;
useNotificationOwner() из NotificationProvider/index.ts даёт внутренний OwnerAccess.
Dispatch отдельно требует canSend; late publication проверяет captured context,
сохраняемый в 10s grace, а не UI status. Expiry/revoke/replacement/close→false.

Переходы: idle → pending (синхронный latch) → accepted/rejected/unknown → idle.
Завершение не запускает следующую попытку из очереди. Повтор — новое явное
действие с новым UUID и предупреждением при unknown. Reset локального error
не запускает SendMessage.

Provider хранит исходный snapshot во время запроса; форма хранит только текущий
ввод, без Map черновиков. Результат не очищает поле по одному совпадению chatId:
сверяются selectionEpoch и editorRevision, особенно для А → Б → А.

Canonical Message 019 после accepted:
chatId/idMessage, direction:'outgoing',kind:'text', исходный text,
timestamp:null, acceptedAt:local epoch ms, status:'accepted'.
Это input к addAcceptedMessage, не отдельная сущность-дубль. Provider history
timestamp и более сильный фактический статус приоритетны; accepted их не стирает.

Новый чат запоминается через rememberPersonalChat({session,chatId,label,
source:'accepted'}); label не преобразуется в name/username/phone.
Overlay и messages query keys определяются 019, не этим модулем.
MessageApplyResult содержит issues:ChatIssueFact[]; применив accepted, controller
передаёт их shared publishMessageIssues из core 019. Объекты ошибок не становятся
текстовыми пузырями; наблюдаемые outlets принадлежат последующему шагу 024.
