# Research 041: сетевой цикл и жизненный цикл уведомлений

Дата: 2026-10-03. Исходники: `create-notification-connection.ts`, `connection-model.ts`, `notification-transport.ts`, `browser-tab-lease.ts`, `refresh-notification-chats.ts`, `apply-notification.ts`, тесты polling/notification-provider/provider-lifecycle и контракт 027. Исходный polling 15/15, RTL lifecycle 8/8; CI 040 на кодовом SHA Passed. Серверный протокол не меняется.

## Фактический контракт

| Фаза | Инвариант |
| --- | --- |
| acquire Web Lock | До settings/receive; занятая вкладка получает limited; поздний lock после close немедленно release. Нет API — явный limited. |
| settings | Один запрос на запуск цикла; `outgoingEnabled=false` даёт предупреждение, но не запрещает send. |
| receive | Только без pending ACK; серверное ожидание 5 s (`receiveTimeout`), client timeout 25 s, notification/provider deadline 8 s, spacing 100 ms. |
| delivery | Проверить scope/epoch/proof; применить или осознанно пропустить валидный ignored event до ACK. Invalid delivery не ACK и переводит в paused. |
| ACK | До нового receive; потерянный ответ повторяет тот же proof, `delivery_changed` очищает proof и запускает receive. |
| temporary error | retrying, backoff [1,2,4,8,10] s с jitter 0.8–1.0, серверный Retry-After не укорачивается. |
| close/retry | close терминален, abort+release+timer cleanup; retry инвалидирует generation, ждёт прежний task, сохраняет единственный lease. |
| recovery/refresh | Модель 040 выдаёт одну recovery-команду на переход; Query обновляет историю открытого чата и ограниченно обновляет список. |

`create-notification-connection.ts` сейчас одновременно управляет React-подписками, lease, сетевыми запросами, ACK, backoff и событиями модели. Транспорт, Web Lock и throttled refresh уже выделены; весь файл переносить в новый слой не требуется. `fetcher` и `acquireLease` уже инъецируются, но `Date.now`, `Math.random`, wait и post прямо привязаны к реализации. Это затрудняет быстрые и детерминированные проверки сетевого цикла.

## Варианты

| Вариант | Преимущества | Цена/риск | Выбор |
| --- | --- | --- | --- |
| Вынести один последовательный run-loop в `run-notification-cycle.ts`; контроллер сохраняет lease, модель и подписки; передать ports `post`, `wait`, `random`, `active`, `applyDelivery`, `transition`, `handleFailure` | Явные границы сети/жизненного цикла; существующие 040/039 модули используются; небольшой diff | Нужно аккуратно сохранить порядок active guard → apply → ACK и обработку ошибок | Выбран |
| Перенести весь контроллер в новый runtime, оставить UI-фасад | Меньше кода в публичном фасаде | Переименование вместо разделения обязанностей; lease и подписки опять смешаны | Отклонён |
| Actor/state-machine framework или отдельный worker | Возможная формализация эффектов | Новая зависимость/процесс, расширение продукта и большой риск ACK-регрессии | Отклонён |

## Проверки и границы

Контроллер вызывает run-loop только после lease, передаёт поколение и AbortSignal. Внешний `active()` остаётся источником проверки поколения/сессии перед применением ответа и после ожидания. `wait` получает `{delay,signal}` и обязан разрешаться при abort; production default — текущая `waitForNotificationRetry`. `now` в transport нужен только для HTTP-date Retry-After, в throttled refresh — для вычисления следующего окна; default `Date.now`. `random` default `Math.random`. Инъекция не меняет production значения. В тестах используются фиктивные scope/proof и controlled Promise/fake timers, реальные credentials не нужны. Тесты не запускают два Playwright runner одновременно: integration использует родительский `test-results`, Query — вложенный каталог; изоляция артефактов — задача 050.
