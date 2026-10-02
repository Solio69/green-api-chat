# Verification: 021-message-composer

**Дата**: 2026-10-03. **Implementation**: CodeAuthorized / Completed.
**Result**: PassedSynthetic; Operator: NotRun.

## Авторизация и preflight

Прямое поручение — все оставшиеся задачи до 024, строго по макету.
До кода прочитаны AGENTS, CODING_RULES, CODE_STYLE, локальный speckit-implement,
constitution, GIT_POLICY, spec/plan/tasks/contracts и текущий diff. Exact FEATURE_DIR
каждой feature подтверждён prerequisites -RequireTasks -IncludeTasks.
Имеющиеся пользовательские изменения и staging сохранены.

## Реализация

Живой MessageSendProvider держит useMutation(retry:false, networkMode:always) и синхронный latch. Локальный useMessageComposer держит текущий текст/revision; MessageComposer отображает поле, MessageComposerFeedback — feedback; pending поле и все повторные отправки блокируются, переключение доступно. Bubble/локальный чат добавляются после idMessage; unknown сохраняет подходящий ввод и предлагает history-first/manual retry. Оформление использует исходные tokens макета.

## Ревью компонентов и превью

Пользователь дополнительно поручил самостоятельное ревью кода и просмотр превью.
Текущая структура: MessageComposer —69 непустых строк разметки; useMessageComposer
управляет editor/snapshot/keyboard/IME/history check; MessageComposerFeedback отдельно
показывает ожидание и ошибку. State остаётся локальным сценарию, новый store не вводится.
NotificationProvider/context.ts отделяет hooks от Provider/Notice и устраняет
циклический импорт, сохраняя публичный index.ts и один controller на QuerySession.

SEND_RESULT_KIND, NOTIFICATION_ACTION и существующие API/HTTP constants используются
во всех соответствующих runtime потребителях. Размер/кодировка случайных ID и jitter
находятся в NOTIFICATION_CONFIG; тестовые размеры/тексты в независимых fixture constants.
Смысловые константы деструктурируются, одноразовые структурные SVG/DTO значения и
независимые ожидания провайдера сохранены согласно CODING_RULES.

Превью использует отдельный production Node server127.0.0.1:3105 и фиктивный
GREEN-API adapter, вымышленные credentials и сообщения. Проверены фактический
Send→accepted→read→incoming, исходные переносы, unknown с сохранённым текстом,
history check→доступный manual repeat, предупреждение о дубле и ограничение второй
вкладки. Ширины320/360/1280 сверены с max-chat-mockup.html; переполнения страницы нет.
Проверка истории имеет44px область нажатия и existing recovery action colors;
«Подключиться снова» оформлено тем же SCSS mixin. Ожидание доступно screen reader без добавления строки в раскладку; ошибки видимы и используют error token.

Для aria-invalid сначала выполнено
`npm run test:query -- tests/query/message-composer.spec.ts --grep 'IME Enter'`:
**1 Failed**, атрибут отсутствовал; после исправления **30 Query Passed**, включая
новое ожидание атрибута и его снятия. Color assertions проверяются в production E2E
с настоящими глобальными цветами, а не на минимальном React-стенде без темы:
**3 Passed** при320/360/1280, обе темы и снятие outline. Первоначальное ожидание цвета
на React-стенде и остаточный unused fixture получили Failed проверки окружения/типов;
они не объявляются поведенческим Red. Браузерные наборы с общим test-results корнем
завершены последовательно; ранний перекрывшийся запуск не является итоговой проверкой.
Чистый рефакторинг опирается на исходный успешный342/30/99 baseline.

Крупный notification controller сохраняет цельный owner/ACK/reconnect lifecycle;
разбиение только по числу строк не создаёт дополнительных владельцев состояния.
Настоящий аккаунт, удалённые настройки и очередь не затронуты; index/коммит не менялись.

## Форма и очистка тестовых констант

Разрешение: прямые замечания пользователя о скролле, подёргивании, networkMode и магических строках во всём наборе тестов. До изменений прочитаны правила; index пользователя не изменялся агентом.

Поле43px использует явные body font/line height и существующий8px space token для внутренних отступов. Однострочный текст не переполняет поле; переносы сохраняются и доступны прокруткой с scrollbar-width:thin и цветами темы. Объявление pending визуально скрыто; поле остаётся readonly/aria-busy, сохраняя фокус при Enter. Геометрия поля и всего composer не изменяется во время запроса. Ошибки/unknown и их действия остаются видимыми.

networkMode берётся из SEND_CONFIG.NETWORK_MODE. Фикстуры используют существующие API/HTTP/provider constants; повторяемые статусы, коды, методы и адреса тестов вынесены в tests/protocol.constants.ts и именованные локальные fixtures. Значения ожидаемого публичного протокола независимы от production constants. Названия тестов, структурные роли DOM, специальные некорректные данные сценариев и обязательные директивы не извлекаются механически.

Регрессии оформления сначала запущены до исправления: **1 Failed**, ожидаемая тонкая полоса имела computed auto. Проверка фокуса до readOnly отдельно получила **1 Failed**: textarea стала disabled/inactive. Эти запуски фиксируют реальные дефекты интерфейса; новая бизнес-логика/серверные контракты не вводились. После исправления production проверки подтверждают неизменную геометрию, readonly/focus, последовательно accepted→delivered→read на320/360/1280; исходные переносы и error colors сохранены.

Добавленная React регрессия подтверждает восстановление delivered из свежей истории после переключения без SSE-статуса: часы исчезают, остаётся один пузырь. Это проверка существующего поведения; реализация статусов не менялась. Настоящая задержка пользователя не воспроизведена: доступная вкладка localhost3000 была на странице login; значения настроек и реальные события не получены. Плашка сама по себе не доказывает выключенные настройки: отсутствующее outgoing поле тоже вызывает её. Галочка требует подтверждённого delivered/read, HTTP acceptance его не заменяет. Настройки провайдера остаются действием пользователя.

Изолированное превью127.0.0.1:3105: однострочное поле height43/clientHeight41/scrollHeight41, computed scrollbar thin; успешная отправка получает read в открытом чате и сохраняет его после close/open. Проверен также unknown; настоящий GREEN-API не вызывался. Временные вкладка и сервер закрыты. Окончательные результаты проверок ниже.

## TDD: фактические Red, Green и Refactor

Client/controller: 2 Failed → 2 Passed. Форма React: 3 Failed, textbox отсутствовал → Green после подключения. Observable status: 2 Failed, img статуса отсутствовал → Green. Production E2E после уже подтверждённого React TDD — регрессия, не отдельный задним числом заявленный Red.

После Green проведён refactor constants/imports/conditions и общих boundaries,
без ослабления assertions. Полная итоговая регрессия указана ниже.

## Фактические проверки

| Команда                                                      | Результат                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `npm run test:integration`                                   | Passed: 342 tests, exit 0                                             |
| `npm run test:query`                                         | Passed: 31 tests, exit 0                                              |
| `npm run test:query -- tests/query/message-composer.spec.ts` | Passed: 8; дополнительно все видимые статусы и гонки history/SSE/HTTP |
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
