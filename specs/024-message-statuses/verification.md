# Verification: 024-message-statuses

**Дата**: 2026-10-02. **Implementation**: CodeAuthorized / Completed.
**Result**: PassedSynthetic; Operator: NotRun.

## Авторизация и preflight

Прямое поручение — все оставшиеся задачи до 024, строго по макету.
До кода прочитаны AGENTS, CODING_RULES, CODE_STYLE, локальный speckit-implement,
constitution, GIT_POLICY, spec/plan/tasks/contracts и текущий diff. Exact FEATURE_DIR
каждой feature подтверждён prerequisites -RequireTasks -IncludeTasks.
Имеющиеся пользовательские изменения и staging сохранены.

## Проверка задержки статуса

Регрессии открытого чата подтверждают accepted→delivered→read по SSE. Дополнительная React проверка восстановления из свежей истории после switch подтверждает замену accepted на delivered без SSE и отсутствие дубля. Реальная задержка пользователя не воспроизведена: доступная вкладка localhost3000 находилась на login, актуальные outgoing настройки и реальные события не получены. Не заменять часики галочкой по HTTP200 или таймеру. Детали и результаты: [ревью формы](../021-message-composer/verification.md#форма-и-очистка-тестовых-констант).

## Реализация

MessageStatusIndicator отличает accepted clock от delivered/read и failed/noAccount; MessageStatusIssue показывает общую ошибку без угадывания сообщения. Shared core019 сохраняет monotonic success, early facts bounded TTL/max и returned issues. Статус коррелируется только по scope/chatId/idMessage. Отказ без id и disconnect не меняют случайные галочки.

Самостоятельное ревью компонентов, смысловых констант и synthetic preview:
[отчёт021](../021-message-composer/verification.md#ревью-компонентов-и-превью).
Серверные guards, ACK/владение и accepted DTO сохраняют контракт.

## TDD: фактические Red, Green и Refactor

Существующее ядро normalization/cache сначала подтверждено baseline Green — искусственный Red не создавался. Observable UI: 2 Failed из-за отсутствующих status img → Green. Затем расширен baseline всеми accepted/delivered/read/failed/noAccount labels, no-id issue и ранним read до HTTP acceptance.

После Green проведён refactor constants/imports/conditions и общих boundaries,
без ослабления assertions. Полная итоговая регрессия указана ниже.

## Фактические проверки

| Команда                                                      | Результат                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `npm run test:integration`                                   | Passed: 342 tests, exit 0                                             |
| `npm run test:query`                                         | Passed: 30 tests, exit 0                                              |
| `npm run test:query -- tests/query/message-composer.spec.ts` | Passed: 7; дополнительно все видимые статусы и гонки history/SSE/HTTP |
| `npm run test:e2e`                                           | Passed: 99 tests, exit 0; production Next build и type validation     |
| `npm run typecheck`                                          | Passed                                                                |
| `npm run lint`                                               | Passed, zero warnings                                                 |
| `npm run lint:styles`                                        | Passed                                                                |
| `npm run format:check`                                       | Passed для source/tests/config; docs/specs исключены штатным ignore   |
| Scoped Prettier `--ignore-path NUL`                          | Passed: отдельная проверка изменённых Markdown документов             |

Автотесты не вызывают настоящий GREEN-API. Production E2E использует реальный
Next server/cookie/routes/client и Node перехват фиксированного provider URL;
React fixture использует настоящий Query/Selection/Notification/Send provider
в StrictMode с поддельными credentials и очередью. Никакие реальные события
не удалялись. Сетевые ответы и исключения не выводят secret/raw envelope.

## Сценарии и код-ревью

- Валидация: оригинальные пробелы/переносы/Unicode, blank, 4096/4097, UTF-8 bytes,
  строгие request fields и chatId, безопасный whitelist accepted DTO, Origin до эффектов.
- Ownership: одинаковая очередь при разных scopes; одна активная вкладка;
  server send guard, повтор ACK, grace/drain/expiry/revoke, удержание send lock.
- Queue: ноль Delete до обработки, один pending delivery, valid ignored получает
  ACK, malformed сохраняется, ambiguous Delete сверяет head, retry не очищает очередь.
- Lifecycle: logout/сессия/поздний старый run, release перед new claim,
  reconnect обновляет свежие десять и сохраняет известные, SSE stall/health/diagnostics.
- UI: field/button43px, footer74px, исходные tokens/пузырьки/шапка/поиск/список,
  ширины1280/360/320, no horizontal overflow; отдельные кнопка/статус/общая ошибка.
  Enter/Shift/IME и доступные названия проверены автоматизацией; физический
  screen reader и клавиатура телефона вручную не проверялись.
- Races: входящее+ACK раньше history, read раньше HTTP без пустого пузыря,
  pending A→B не очищает новое поле; успешный новый чат сохраняется при GetChats gap;
  no-id отказ не выбирает случайное сообщение, read не понижается старой историей.
- Constants, именованные сложные условия, модульные границы, public component exports,
  отсутствие HTML injection/console secrets проверены по CODING_RULES/CODE_STYLE.

Ошибки импорта/сборки/фикстуры не считались TDD Red. Неправильный fixture текст
expired400 исправлен на уже документированный provider ответ; это коррекция
фикстуры, а не новое поведение. Mechanical JSON-shadowing и Sass rem+px
регрессии исправлены и повторно проверены. Новые тесты остаются в репозитории.

## Как проверить самому

1. Перезапустить dev server после обновления кода; открыть одну рабочую вкладку.
2. В кабинете GREEN-API вручную проверить `incomingWebhook: yes` и пустой
   `webhookUrl`. Приложение лишь проверяет настройки; само их не меняет.
3. Для статусов вручную включить outgoing message/status toggles, перечисленные
   в quickstart024. Их отсутствие даёт диагностику, но не блокирует Send.
4. Выбрать личный чат либо найти получателя и нажать «Написать»; ввести текст
   и отправить Enter/кнопкой. До ответа нет пузыря; после idMessage — «Принято API».
5. Ответить из Telegram, открыть/прочитать исходящее: входящий текст и фактические
   delivered/read должны прийти через server Receive → SSE → apply → ACK → Delete.
6. Во второй вкладке проверить явное ограничение рабочего чата; отправка недоступна.

## Ограничения и следующий шаг

Реальный GREEN-API, ручное пользовательское ревью и remote settings: **NotRun**.
Нужен один постоянный Node-процесс. Несколько workers/serverless/multi-instance
и proxy hosting не заявлены проверенными; публикация остаётся отдельным E06.
История fresh count10 и retained Query RAM не обещают полную историю/replay;
early status bounded 1000 facts/5min. ACK подтверждает RAM применение, не durable
хранение. Lost Send response имеет неизвестный исход; ручной повтор может дать
дубликат, автоматического повтора и текстового сопоставления нет.

Все задачи feature выполнены в разрешённом объёме. Следующий шаг — пользовательское
ревью и ручная проверка реального инстанса; публикация отдельно. Зависимости,
удалённые настройки и пользовательский index не менялись; Git mutations отсутствуют.
Название общего коммита: `feat: add text messaging with SSE notifications and delivery statuses`.

## Исправление по итоговому ревью

В первом замороженном проходе выявлена связанная ошибка022/023:
registry active guard запрещал reader продолжать работу при retrying,
хотя backoff должен продолжать получение и блокировать только новые Send.
Новые два теста actual registry + actual loop получили **2 Failed / 3 Passed**
(ожидаемое восстановление оставалось false после backoff), затем **5 Passed**.
Reader guard теперь проверяет attached/paused/revoked; tryAcquireSend по-прежнему
блокирует retrying. Проверены оба случая: временный Receive и временный Delete,
восстановление receiving, ровно один applied delivery, ACK перед Delete и
одна повторная проверка head. Это настоящий поведенческий Red, не ошибка среды.
После исправления выполнена полная регрессия342 integration/30 Query/99 E2E.
Первый read-only проход закончился до исправления; итоговый analyze повторён
отдельным замороженным проходом после новых Green и обновления документов.
