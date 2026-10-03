# Data model 046: поиск получателя

| Сущность | Владелец | Жизненный цикл/инвариант |
| --- | --- | --- |
| Search mode phone/username и формат запроса | recipients/model | parseSearchRequest не импортирует React/server; прежние длины/regex/префикс |
| Формат подписи | recipients/model | phone -> нормализованное число строкой; username -> имя с @ |
| Server SearchContext/Response | recipients/server | сессия, media/body guards, provider result -> безопасный JSON; 401 очищает сессию только при подтверждённом invalid token |
| Browser search result/error | recipients/ui request adapter | found chatId / not-found / код ошибки / lost access; неожиданный JSON — прежняя ошибка |
| mode/value/result/pending/field focus | локальный useRecipientSearch | один активный запрос; новый режим/ввод сбрасывают прошлый результат; unmount/close отменяет поздний ответ |
| selected chatId/label | ConversationSelection | меняется только кнопкой открытия найденного результата, не запросом поиска |

Никакого persistent/shared store поиска. Scope принадлежит QuerySession; новый экземпляр подключения не наследует результат старого. В поле нет сериализуемого name до гидратации, если он отсутствует сейчас; этот HTML контракт уточняется baseline.
