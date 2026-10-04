# Contract 046: границы поиска

1. recipients/model экспортирует parseSearchRequest, formatRecipientLabel, константы режимов/результатов. Без React, Request/Response и server runtime.
2. recipients/server экспортирует handleSearchRequest; app/api/recipients/search/route.ts остаётся тонким Next route. HTTP method/body/status/cookie и безопасный JSON не меняются; resolveSearchResult живёт только в server.
3. recipients/ui/RecipientSearchForm/request-recipient-search.ts отправляет существующий POST /api/recipients/search JSON {mode,value}, no-store. Из ответа возвращает found chatId, not-found, отказ с известным кодом, потерю доступа или ошибку неожиданного ответа; реквизитов/провайдерского тела в результате нет.
4. useRecipientSearch владеет локальными mode/value/validation/pending/result/error, блокирует повтор и смену режима во время запроса, отменяет активный запрос при unmount/close. Поздний результат не меняет новое подключение; 401 направляет на login только для активного владельца.
5. UI пяти компонентов сохраняет разметку, тексты, стили, aria/focus, keyboard, responsive layout. Кнопка открытия вызывает существующий openConversation({chatId,label}) только после found; поиск не отправляет сообщение.
6. Внешние потребители импортируют public model/server/ui entries; клиентский graph не достигает server entry/runtime. Новых режимов и хранилища нет.
