# Контракт чистой модели сообщений 042

## Входы

`mergeValidatedMessageFacts({current, facts, contentSources})` принимает отображаемые сообщения текущего чата/наборов, source-tagged факты в порядке их поступления и необязательную карту provenance. Все факты проверяются до результата: валидный MessageDTO, личный chatId, idMessage и допустимый source. При invalid input функция бросает существующую `INVALID_FACTS` без частичного результата или мутации аргументов. Для действующих вызовов `mergeMessageFacts({current,messages,source,contentSources})` остаётся адаптером, который помечает все входные сообщения общим source (default history).

`mergeStatusFacts({messages,statuses,early,now})` принимает явное число миллисекунд и возвращает новые сообщения, ранние факты и issues. Контракт совпадает с текущим: подтверждение read/delivered монотонно, конфликт failed/noAccount не скрывается, ранний факт attach только по точной паре `(chatId,idMessage)` до TTL; превышение лимита вытесняет старейший по observedAt/sequence.

## Результат

`{messages,contentSources?,issues}` сохраняет публичную форму MessageDTO для UI. Ключ выбора/дедупликации и provenance — пара `(chatId,idMessage)`. Provider timestamp в секундах сравнивается как миллисекунды; acceptedAt уже в миллисекундах. Известный текст не заменяется null, accepted локальный текст может уступить подтверждённому provider содержимому, поздняя история не затирает live. Повтор того же факта не создаёт вторую bubble и не мутирует исходные объекты.

Новый источник, формат API, поддержка медиа или бизнес-правило статуса этим контрактом не вводятся. Cache orchestration и подписчики принадлежат задаче 043.
