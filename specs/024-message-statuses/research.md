# Исследование delivery статусов

**Дата**: 2026-10-02; фактические настройки аккаунта не проверены, тесты NotRun.

[OutgoingMessageStatus Telegram](https://green-api.com/telegram/docs/api/receiving/notifications-format/statuses/OutgoingMessageStatus/) определяет delivered/read/failed/noAccount и приводит failures без idMessage. Уведомления failed/noAccount нельзя отключить; noAccount также связан с приватностью. Поэтому нет enum sent, отсутствие id не повод удалить известный отказ как повреждённый или изменить «последнюю» bubble. Документация требует outgoingMessageWebhook/outgoingAPIMessageWebhook/outgoingWebhook для success statuses. [GetSettings](https://green-api.com/telegram/docs/api/account/GetSettings/) описывает toggles, но автоматический SetSettings не входит. Пользователь вручную включит нужные уведомления.

| Вариант                                          | Преимущества                          | Риски/решение                                                      |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| Сопоставить failure с последней попыткой/текстом | Быстро                                | Недостоверно при races/внешней отправке; запрещено                 |
| Failure без id как general chat/connection issue | Корректная известная информация       | Не определяет конкретную bubble; согласовано пользователем         |
| Перезаписывать status последним arrival          | Просто                                | Поздний delivered/HTTP acceptance понижает read                    |
| Монотонный success + явный conflict issue        | Сохраняет достоверное подтверждение   | Failure contradiction не имеет произвольного causal order; выбрано |
| Early status без ограничения                     | Удобно                                | Бессрочное накопление неизвестных ids                              |
| Partial facts TTL 5 мин/max 1000                 | Bounded memory, merge позднего ответа | После expiry/cache loss recovery ограничен; технический выбор root |

Нормализация provider и reducer чистые, не вызывают дополнительные API и не создают сообщения из отсутствующего текста. При подтверждённом read позже failed сохраняется read и появляется general issue; нельзя утверждать, что более поздний arrival отменяет успешную доставку. Это корректность при неопределённом provider order, не новая retry политика. Merge общей модели 019 использует одинаковые правила для history/live/accepted, без второго store.

Existing Playwright integration tests с QueryClient/fake clocks проверяют permutations и eviction, browser Query fixture — наблюдаемые labels/issues без редизайна. Новые пакеты не нужны. Никакой real Send/Delete/настройки в проверках. Источники принимаются для Telegram, не переносятся статусы WhatsApp по сходству names.
