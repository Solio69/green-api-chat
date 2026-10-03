# Data model 039

- `GreenApiRequest`: credentials, имя метода, HTTP method, optional suffix, optional JSON body, готовый AbortSignal и внедряемый fetcher. Только серверный вызов; не является объектом сессии или записью БД.
- `Response`: нативный сырой ответ fetch. Транспорт не читает, не нормализует и не кэширует тело.
- `OperationPolicy`: живёт у каждого адаптера: deadline/caller signal, retry/wait, status/JSON classification. SendMessage после начала dispatch не переводит caller abort в повтор или подтверждённый отказ.
- `ProviderResult`: существующие union-типы методов; не унифицируются и не передаются клиенту как сырой ответ.

Инвариант: URL с apiTokenInstance никогда не попадает в пользовательские ошибки или логи. Повторные вызовы транспорта делает только разрешивший их адаптер.
