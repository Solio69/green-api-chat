# Contract: GREEN-API transport 039

```ts
fetchGreenApi({
  credentials, methodName, method, suffix?, jsonBody?, signal, fetcher = fetch
}): Promise<Response>
```

Фиксированный host и `waInstance` prefix из `GREEN_API_CONFIG`; `encodeURIComponent` для id/token; suffix добавляется после encoded token. `RequestInit`: `method`, `cache:'no-store'`, `redirect:'error'`, готовый `signal`, и только при `jsonBody` — `Content-Type:application/json` и `JSON.stringify(jsonBody)`. Передача undefined body исключена типом/вызовом; если нужно JSON null, это явное значение. Транспорт ровно один раз вызывает fetcher и возвращает тот же Response; не читает тело, не повторяет, не создаёт deadline и не перехватывает ошибку. Адаптеры сохраняют текущие типы результатов и исключений.

Request policy matrix — [research.md](../research.md). Для SendMessage caller abort проверяется перед транспортом, затем в транспорт передаётся deadline-only signal. Для чтений с caller signal передаётся составной signal. Notification adapter отдельно создаёт свой deadline, разбирает Retry-After и response. Нельзя логировать URL или сырое тело.
