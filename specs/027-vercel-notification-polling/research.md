# Research

2026-10-03. Принята схема без shared server state.

- [Vercel execution](https://vercel.com/kb/guide/vercel-services-fluid-compute): экземпляры могут меняться; instance memory не общий реестр. [Limits](https://vercel.com/docs/functions/limitations): ограниченная длительность функций. maxDuration 20 и receive 5/deadline 8 укладывают один запрос в ограниченный бюджет; ACK может включать два upstream вызова.
- [ReceiveNotification](https://green-api.com/telegram/docs/api/receiving/technology-http-api/ReceiveNotification/): ожидает до 5 по умолчанию, сразу возвращает событие, до Delete возвращает прежнюю голову. [Delete](https://green-api.com/telegram/docs/api/receiving/technology-http-api/DeleteNotification/): receiptId/resultboolean. Нельзя удалять до применения браузером.
- [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API): exclusive lock одного origin, ifAvailable, освобождается по завершении callback; HTTPS/localhost. Не координирует другие устройства/origins/profiles.
- HMAC из node:crypto: подпись и timingSafeEqual, общий секрет уже нужен cookie. Не требуется новый SDK, база, очередь, provisioning.

Варианты: SSE+shared store добавляет инфраструктуру; stateless receive+signed ACK выбран; удаление до ответа проще, но нарушает согласованный ACK и теряет событие при обрыве.
