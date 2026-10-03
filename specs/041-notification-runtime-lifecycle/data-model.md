# Data Model 041: notification runtime

| Сущность | Поля/владелец | Инвариант |
| --- | --- | --- |
| Connection model | Union 040, controller | Только transition меняет status/generation/pending ACK; runtime читает pending token через selector. |
| Attempt | generation, AbortSignal, active guard; controller | Только одна runningTask; новый retry начинает attempt после завершения предыдущего. |
| Owner | connectionScope, ownerEpoch, lease release; controller | Без Web Lock нет request; поздний lease освобождается. Owner epoch сохраняется при ручном retry на том же lease. |
| Cycle | settingsReady, failures; run-loop | Локален одному attempt; settings один раз на attempt; backoff увеличивается только на временных ошибках и сбрасывается на успешном цикле. |
| ACK proof | token в модели 040 | После apply до ACK, переживает временный сбой; очищается на подтверждении/expiry/manual retry. |
| Timing | now, random, wait; инъекция с production defaults | HTTP-date Retry-After и refresh используют now, jitter — random, spacing/backoff — abort-aware wait. |
| Public snapshot | status/canSend/issue; controller | Ссылка стабильна, пока публичные значения не изменились. |

Новых сохраняемых данных, БД, серверного состояния или UI-состояния нет. Failure классифицируется прежними кодами. Settings/receive/ACK DTO и таймауты не меняются.
