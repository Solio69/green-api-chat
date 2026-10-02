# Нормализация provider notification

**Проверки**: NotRun. Provider adapter принимает unknown; не доверяет TypeScript cast.
Общая клиентская модель: [019 message-cache](../../019-chat-history-window/contracts/message-cache.md). Транспорт: [023 SSE](../../023-notification-sse/contracts/sse-stream.md). Статусы: [024](../../024-message-statuses/contracts/message-statuses.md).

Envelope сначала проверяет положительный безопасный целочисленный receiptId и body object, непустой typeWebhook, instanceData.idInstance совпадает с server credentials, typeInstance=telegram. Номер provider instance не преобразуется через небезопасный number; допустимый numeric provider id должен быть safe integer, сравнивается строкой. Неизвестный/непроверяемый envelope — malformed, pause/noACK/noDelete. Успешный HTTP ответ с пустым body после long poll и JSON `null` нормализуются как пустая очередь; иной JSON без валидного envelope не пустая очередь.

| Provider событие                                                                                      | Результат                                                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| incomingMessageReceived личного user чата, новый текст                                                | incoming_message с общей MessageDTO019                                     |
| Известное новое нетекстовое входящее сообщение личного чата                                           | incoming_message kind=unsupported, без вложения                            |
| outgoingMessageStatus                                                                                 | message_status по правилам 024; failed/noAccount без idMessage допустимы   |
| Корректное событие вне объёма, группа, edit/delete/reaction, внешнее outgoing/API outgoing            | ignored без сырого payload и без нового realtime пузыря                    |
| Известный текстовый тип с отсутствующим текстом, неверной идентичностью или повреждённой структурой   | malformed, pause/noDelete                                                  |
| Новый неизвестный typeWebhook/typeMessage с проверенным базовым envelope и identity где она применима | ignored; отсутствие знания формата не превращается в текст/успех сообщения |

Для incoming identity нужны непустой строковый idMessage и проверенный структурно непустой строковый chatId через shared018 `isChatId`/`isPersonalChatId` из `src/lib/chats/validate-chat-id.ts`, senderData.chatType='user'; отрицательный group id осознанно вне объёма. Проверка id структурная: trimmed/control-free, без leading minus/legacy @c.us/@g.us для personal; numeric conversion или строгий positive regex не вводятся. Фактический source incoming chatType=user устанавливает личный тип, а строковая цифра сама по себе не подтверждает происхождение. `senderData.sender` не подменяет chatId. Проверенный конечный timestamp целочисленный UNIX seconds передаётся без ms-конвертации. Для textMessage читать messageData.textMessageData.textMessage; для extendedTextMessage — messageData.extendedTextMessageData.text. Строка не обрезается и не исполняется HTML. Строка, содержащая credential token, не отправляется/не логируется, вызывает безопасную ошибку нормализации вместо тихого изменения сообщения.

Известные media kinds image/video/document/audio/location/contact/poll/sticker дают лишь identity/timestamp и unsupported MessageDTO с text:null; нейтральный label выводит renderer019. Для reaction/edit/delete флагов/types/идентификаторов обновления — ignored, нельзя создать новый обычный пузырь. Отсутствие ожидаемой структуры известного события не равно валидному ignored.

Чат события хранит проверенный chatId и actual displayLabel из непустых senderContactName, chatName, senderName в таком порядке; пустые поля дают null. Не пересылать senderPhoneNumber, wid, instanceData, download URL, MIME, raw body. Подпись — фактическое свойство envelope, не invented PersonalChat.name; применяет session-chat-overlay019. Query scope назначает server owner context, не provider payload. Примеры/fixtures используют вымышленные значения.

Валидный ignored после браузерного сознательного no-op обработки получает ACK; malformed не имеет delivery для успешного ACK. Validation failure сообщает общий code и stage, без копии повреждённых данных. Сервисная ошибка транспорта не становится outgoing failed для всех сообщений.

`src/lib/notifications/normalize-message-status.ts` принадлежит 022 и возвращает wire ProviderStatusFact024; shared MessageStatusFact019 получается только при полной identity. Ошибка без id не превращается в статус случайного MessageDTO, валидный unknown enum — ignored. Этот adapter не импортирует UI/code024 и компилируется до него.
