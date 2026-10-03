# Research 040: исходная модель polling-контроллера

Дата: 2026-10-03. Основание: `src/lib/notifications/create-notification-connection.ts`, `NotificationProvider`, `NotificationNotice`, `tests/integration/polling-connection.spec.ts` и Query/E2E. Серверный ACK-протокол и сетевой цикл 041 здесь не меняются.

| Триггер/фаза | Текущее состояние и эффект | Инвариант для переноса |
| --- | --- | --- |
| Начальное/close | closed, canSend false, issue null; close инвалидирует generation, abort/release | close терминален; поздние результаты не публикуют состояние |
| start/retain | connecting, canSend false; один runningTask | повторный start не создаёт сеть |
| Web Lock занят/недоступен | limited, issue ownership_busy/browser_lock_unavailable, canSend false | без lease сеть не начинается |
| settings подтверждены | connected, canSend true, issue outgoing_notifications_disabled только при отключённых исходящих | отсутствие статусов отправки не блокирует саму отправку |
| receive без delivery | pending ACK отсутствует; следующий цикл после spacing | нет фиктивного ACK |
| valid delivery применён | proof сохраняется как pending ACK; до его подтверждения новый receive запрещён | повторный ACK возможен, сообщение не дублируется |
| ACK success/expired | success очищает proof и продолжает; expired очищает proof и повторяет receive | потеря ACK не порождает параллельный receive |
| временный сбой | retrying, canSend false, issue retry_later; backoff и возможный pending ACK | успешное восстановление публикует recovery один раз |
| invalid event/not configured | paused, canSend false, issue из отказа | ручной retry возможен, очередь не подтверждается |
| auth/scope failure | session.handleSessionError → cleanup/close | старое поколение не восстанавливает доступ |
| manual retry | generation++, abort старого run, дождаться task, start; browser lease сохраняется | поздние эффекты старого поколения игнорируются |

Сейчас `status`, `canSend`, `issue`, `pendingAck`, `readyOnce`, `outgoingEnabled` и `generation` обновляются независимо. `NotificationNotice` и `NotificationProvider` читают публичный snapshot `{status,canSend,issue}`; тексты и inert-ограничение должны остаться. `canSend=true` только при connected, включая pending ACK и отключённые outgoing status webhooks. Recovery возникает при переходе **из не-connected в connected после первого успешного connected**, не при каждом цикле. `pendingAck` переживает временный сбой того же run, но очищается при ручном retry/close.

| Вариант | Преимущества | Риск/цена | Выбор |
| --- | --- | --- | --- |
| Чистый reducer с discriminated union фаз, generation и projection публичного snapshot; контроллер исполняет effects | Несовместимые сочетания недоступны; сеть остаётся в контроллере; UI-контракт стабилен | Нужно точно провести все точки перехода | Выбран |
| Только enum status и прежние отдельные flags | Малый diff | Дублирующие поля и pending ACK остаются несогласованными | Отклонён |
| Новый state manager/actor framework | Формальная модель эффектов | Новая зависимость и большой перенос 041, риск смены ACK-ритма | Отклонён |

Исходное покрытие polling-connection: 14 tests, включая ACK, retry, busy/unsupported lease, StrictMode и поздний close. Query/browser покрывают Web Locks. Добавляются unit-таблица переходов и RTL-проверка видимого предупреждения; новые пакеты не нужны.
