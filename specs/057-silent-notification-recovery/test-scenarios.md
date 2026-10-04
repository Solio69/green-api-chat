# Матрица проверок

**Дата**: 2026-10-04  
**Статус**: Unit/component/integration и браузерные сценарии выполнены; результаты в [verification.md](verification.md).

## Изменяемое поведение — TDD

| ID | Уровень и файл | Условия и действие | Ожидаемый результат | Требования |
| --- | --- | --- | --- | --- |
| TS-01 | Unit: tests/unit/notification-connection-model.test.ts | settings_ready → temporary_failure | retrying, canSend=true; recovery ещё не опубликован | FR-002 |
| TS-02 | Unit: тот же файл | start → temporary_failure без settings_ready | canSend=false; после успешного settings_ready=true | FR-003 |
| TS-03 | Unit: тот же файл | delivery_applied → temporary_failure → ack_confirmed/ack_expired | pendingAck сохраняется до подтверждения/истечения; canSend=true при retrying | FR-002, FR-005 |
| TS-04 | Component: tests/component/notification-notice.test.tsx | connected → retrying → connected, повторить несколько раз; отдельно retrying до первичного подключения | Плашки и кнопки переподключения нет на всех временных переходах; при отсутствии независимых ошибок контейнер пуст | FR-001, FR-007 |
| TS-05 | Integration: tests/integration/polling-connection.test.ts | Настройки успешны, receive отвечает 503, затем успешно | Во время retrying canSend=true, следующий receive выполняется после backoff, один recovery | FR-002, FR-005 |

TS-01/TS-04/TS-05 подтвердили поведенческий Red на прежнем коде; TS-02 зафиксировал сохранённое ограничение. Ошибка окружения до запуска тестов не засчитывалась Red.

## Сохранённое поведение — регрессия

| ID | Уровень и файл | Проверка | Ожидаемый результат | Требования |
| --- | --- | --- | --- | --- |
| TS-06 | Unit: tests/unit/notification-connection-model.test.ts | closed, connecting, limited, paused; включая переход из ранее подключённого состояния | canSend=false во всех ограниченных состояниях | FR-003 |
| TS-07 | Component: tests/component/notification-notice.test.tsx | Все варианты limited/paused и retry | Сохранены нужные alert, текст и однократный вызов ручного retry | FR-006 |
| TS-08 | Component: tests/component/notification-notice.test.tsx | Отключены исходящие уведомления; отдельно синтетическая MessageIssue в connected и retrying | Настройки и реальный MessageStatusIssue видны; ошибка статуса не исчезает вместе с плашкой восстановления | FR-006 |
| TS-09 | Integration: tests/integration/polling-connection.test.ts; unit: tests/unit/notification-cycle.test.ts | Незавершённый/потерянный ACK, Retry-After, восстановление, close | Нет receive до завершения ACK; proof не теряется, backoff сохраняется, поздние события игнорируются | FR-005 |
| TS-10 | Component: tests/component/provider-lifecycle.test.tsx | Unmount во время retrying и React lifecycle | Таймеры и запросы прекращаются, lease освобождается | FR-005 |
| TS-11 | Integration: tests/integration/message-send-controller.test.ts | Удержанная попытка и повторное нажатие; неизвестный исход; закрытие сессии | Одна отправка; unknown не повторяется автоматически; устаревший результат не попадает в новую сессию | FR-003, FR-004 |

Существующие проверки переиспользованы. Для TS-08 mock `useMessageIssues` расширен управляемым синтетическим значением; проверен настоящий `MessageStatusIssue`, без подмены его JSX.

Повторяемые входные состояния и ожидаемые тексты берутся из тестовых констант в `tests/notifications/`, не из констант приложения. Это оставляет проверку пользовательского текста независимой. Типы матчеров `jest-dom` и алиас `@/` для файла в редакторе подтверждаются отдельным `tests/tsconfig.json`.

## Браузерный контракт

Файл tests/e2e/notification-recovery.spec.ts, 360 и 1280 px; существующая owner-fixture сбрасывает синтетического провайдера для каждого теста.

1. Создать синтетическую сессию и открыть переписку; настройки подключения успешны. Удержать receive через управляемый ответ.
2. Снять положение/размеры окна чата и редактора после готовности интерфейса.
3. Ответить receive временным отказом. Дождаться следующего receive после штатного backoff, удержать его: состояние всё ещё retrying. Убедиться, что плашки нет, положение чата не изменилось, отправка доступна для валидного текста.
4. Нажать «Отправить» и удержать его ответ. Проверить «Отправляется…», блокировку повторного нажатия, сохранение текущего текста и ровно один запрос отправки.
5. Вернуть receive успешный пустой ответ, затем снова временный отказ; держать следующий запрос. Проверить отсутствие плашки и сдвига на каждой наблюдаемой фазе. Отправка по-прежнему одна.
6. Разрешить ответ отправки. Проверить принятие сообщения и очистку редактора; отсутствие дублирующего POST.
7. В finally освободить все удержанные запросы и маршруты, включая раннее падение assertion. Не использовать sleep для имитации pending: завершения управляются Promise и наблюдаемыми HTTP/DOM условиями.

Playwright проверяет интеграцию уже прошедшего TDD поведения; это не подменяет Red из unit/component/integration. Существующий набор E2E и Vitest проверяет ошибки самой отправки.

## Критерий завершения

Все обязательные проверки plan выполнены после возобновления. В verification отдельно записываются Red, Green, финальный запуск, review и ограничения. Production-сбой не воспроизводится реальными реквизитами и не объявляется устранённым.
