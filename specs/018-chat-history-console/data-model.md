# Data model: чтение истории

## Сущности

| Сущность          | Поля/состояние                                     | Источник и жизнь                                                  |
| ----------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| QuerySession      | connectionScope, active, client, cleanup callbacks | Cookie/HMAC включая expiry; keyed provider до close               |
| Обращение         | chatId, accessId                                   | Единственный выбор 025; новое открытие увеличивает accessId       |
| Сетевой snapshot  | scope, chatId, messages                            | Свежий HTTP; отдельный Querykeyperaccess, gcTime: 0 после отписки |
| Известная история | MessageDTO[]                                       | Единый mergedkey(scope,chat); удержание до close                  |
| Ошибка            | HistoryQueryError.code/status                      | Проверенный API, без rawbody и реквизитов                         |

Публичная модель сообщения, направление, provider timestamp, локальное
acceptedAt, приоритет данных и статусные факты определены единожды в
[019/message-cache](../019-chat-history-window/contracts/message-cache.md).
018 создаёт историю и базовое слияние; будущие producers отдельно интегрируются.
Кеш списка 014 не копируется и не меняет политики.

## Нормализация history

Только массив проверенных сообщений запрошенного chatId. Обязательны idMessage,
type incoming/outgoing, chatId, непустой typeMessage и безопасный timestamp.
TextMessage требует textMessage:string; текст не trim. Все остальные валидные
типы дают unsupported/text:null. Вложения не передаются. История ставит
acceptedAt:null; outgoing documented delivered/read разрешены, неизвестный
optional статус не создаёт подтверждение. Дубликаты id объединяются по правилам
общей модели; известное положительное подтверждение не теряется.

Не определять сообщение по тексту, позиции, телефону или timestamp. Отсутствие
сообщения в свежие десять сообщений не является его удалением. Не смешивать разные chatId даже
при одинаковом idMessage. Raw metadata/секреты/URL поставщика не сохраняются.

## Переходы

Без выбора → новое обращение/pending → свежий success/error → guarded merge
и диагностический вывод. При сохранённых данных чтение идёт isFetching, данные
сохраняются; error не делает их свежим успехом. Empty success создаёт [] лишь
для ещё неизвестной истории, не удаляет известное. A→B→A имеет разные accessId.
Mobileback оставляет выбор/данные; close снимает выбор и отменяет прежнее чтение,
но не очищает историю. Sessionclose скрывает данные, abort/cancel и clear;
поздние promises не восстанавливают записи.
