# Research 046: модуль поиска получателя

Дата: 2026-10-03. Текущий RecipientSearchForm смешивает React state, валидацию, fetch/разбор JSON, переход при 401, выбор переписки и JSX. Пять вспомогательных компонентов находятся в src/components. Серверные handle-search-request/resolve-search/validate-search/constants находятся в src/lib/recipients. Baseline: 7/7 серверных integration, 10/10 production browser поиска; unit форматирования и RTL результата уже существуют. Новых пакетов нет.

| Вариант | Плюсы | Риск/цена | Решение |
| --- | --- | --- | --- |
| Перенести только компоненты | Малый diff | Смешанные обязанности и старый server/model import graph сохраняются | Не выбран |
| Разделить model/server/ui и локальные browser adapter/hook, перенести пять компонентов | Явный контракт, отдельно тестируемые правила и lifecycle, соответствие карте 035 | Требуется обновить все потребители и тесты, проверить переходы и подпись | Выбран |
| Ввести глобальный store или Query mutation для разового поиска | Общий cache | Новый lifecycle и shared state без существующего потребителя | Не выбран |

По карте 035 resolve-search назначен в model, но фактически импортирует server/http и возвращает Response. Чистая model не может иметь такую зависимость: переносим resolve-search в recipients/server и отдельно корректируем строку ownership-map.csv. Форматирование подписи не зависит от React/сервера; помещаем format-recipient-label в recipients/model и корректируем его строку CSV. Серверный маршрут остаётся в app и делегирует server entry. Поиск использует текущие phone/username правила и не создаёт чат сам: открытие выполняется существующим публичным контрактом ConversationSelection. Публичные client/server входы раздельны.
