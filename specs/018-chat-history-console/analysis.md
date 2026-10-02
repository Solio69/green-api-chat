# Анализ018: свежая история выбранного чата в консоль

**Дата**: 2026-10-02. **Этап**: анализ реализации и предкоммитное ревью.
**Авторизация**: пользователь отдельно разрешила параллельное получение истории
субагентом в текущем ревью025; согласованная spec018 сохраняет count10 и консоль.
**Итог**: Passed; открытых findings0. Ревью пользователя и реальный инстансNotRun.

## Контекст и доказательство read-only

Exact prerequisites: -Json -RequireTasks -IncludeTasks с ExpectedFeatureDirectory
D:\Pet-projects\green-api-chat\specs\018-chat-history-console: exit0,
FEATURE_DIR точно совпал. Прочитаны spec/plan/tasks, research/data-model,
architecture-notes, HTTP/Query contracts, оба checklist и quickstart/verification.
Сверены выбор025, list014 и общая модель019, будущий Origin020/023. Source review
охватывает provider/handler/route/normalizer/fetch, message cache/reducer,
QuerySession/hook/controller, fixture и integration/query/E2E тесты.
Входы: [spec.md](spec.md), [plan.md](plan.md), [tasks.md](tasks.md),
[HTTP](contracts/history-api.md), [Query](contracts/history-query.md),
[message-cache019](../019-chat-history-window/contracts/message-cache.md),
[025](../025-conversation-selection/analysis.md),
[общая готовность](../../docs/messaging-readiness.md).

**Файлов**: 527. **SHA-256 инвентаря**: 6CBF139CFD8D1E1F4489132C1EB420AECB386F872DD4243A3A04A6F25E80D76A.
Полный список и каждый SHA-256 до/после сохранены в памяти координатора:
совпадение точное, различий0. Во время прохода ни исходники, ни документы,
ни analysis.md не записывались; все writers018 остановлены. Этот полный отчёт
сохранён отдельным действием после завершения анализа.

Исключены .git, node_modules, .next, playwright-report, test-results, coverage,
out, build и tsconfig.tsbuildinfo: metadata/dependencies/generated output.
Исходники, конфигурация, docs/specs, правила и scripts включены; содержимое
секретных файлов не выводилось.

## Findings

| ID  | Категория | Severity | Место | Суть / рекомендация   |
| --- | --------- | -------- | ----- | --------------------- |
| —   | —         | —        | —     | Открытых findings нет |

CRITICAL/HIGH/MEDIUM/LOW:0/0/0/0. Существенных неоднозначностей, дублей,
противоречий, отсутствующего базового покрытия и нарушений C1–C8 не найдено.
Исправления и записи документов завершены до read-only прохода.

## Сервер и публичный контракт

POST /api/chats/history использует текущую зашифрованную HttpOnly cookie,
X-Connection-Scope и фиксированный count10 в GetChatHistory. Тело принимает
только подтверждённый personal chatId. Guard выполняется до body/provider;
missing/null/invalid/foreign Origin даёт403 invalid_request, cookie сохраняется.
HTTP(S) source запрещает userinfo/path/query/fragment. Назначение определяется
протоколом Request.url и фактическим HTTP Host: NextRequest нормализует loopback
URL. Неверный Host отклоняется без fallback; ordinary raw Request без Host
использует request.url. X-Forwarded-* и allowlist не введены. Та же техническая
граница уточнена в будущих contracts020/023 без реализации этих feature.

Provider URL фиксирован на GREEN-API с encodeURIComponent реквизитов, no-store,
redirect:error и общим deadline10000ms. Один серверный retry429 через1100ms
обоснован чтением; retry:false клиента не умножает запросы. Ошибки сети,
upstream/body/identity, rate-limit и session/scope отличаются от пустого успеха.
401/409 закрывают сессию только по нормализованному session_required/
connection_changed; ownership/busy ошибки будущих шагов не объявляются logout.

Нормализатор проверяет personal chatType/chatId/idMessage, направление и
целочисленный UNIXtimestamp; выводит whitelist DTO без provider metadata,
media URL и реквизитов. Текст сохраняет исходные пробелы/переносы. Нетекстовый
элемент имеет kind unsupported/text null, без загрузки вложения. Delivered/read
только фактические; неизвестный статус не превращается в подтверждение доставки.
Invalid payload целиком отвергается; разные idMessage не объединяются по тексту.

## Query, lifecycle и консоль

Каждый accessId025 создаёт request key scope/chatId/accessId, поэтому возврат
и повтор того же chatId запрашивают свежие10. Request gcTime0/retry:false,
без mount/focus/reconnect/interval refetch; ручной refetch привязан к текущему
обращению. Общий cache key scope/chatId сохраняется в памяти с gcInfinity до
завершения подключения. Закрытие переписки не удаляет накопленные сообщения.
Defaults устанавливаются до setQueryData, исключая случайный network fetch.

Merge immutable и дедуплицирует idMessage внутри scope/chatId, сохраняет известные
текст/время и не понижает delivered/read. Общие future issue types/reducer
ограничены минимальным ядром019; UI/outlets/notifications/send producers не
добавлены. applyHistoryMessages валидирует принадлежность и активную сессию.
Мобильный back сохраняет монтаж, close скрывает pending без удаления истории;
A→B→A, late response и новый scope не публикуют прежний результат.

QuerySession делает active=false синхронно до cleanup/listeners/cancel/clear;
callbacks изолированы от ошибок друг друга. registerCleanup/handleSessionError
и readonly connectionScope сохраняют существующую политику списка014. Успешный
запоздавший fetch не может восстановить закрытые данные или перейти в новыйscope.

Невидимый Controller возвращает null и подписывается на QueryCache completion
текущего request key. WeakMap<Query,counters> различает actual data/errorUpdateCount,
дедуплицирует StrictMode/consumers и обнаруживает повтор одинакового JSON в одном
tick при structuralSharing. Лог содержит chatId/count10 и именно свежий snapshot;
накопленный merged cache за свежий ответ не выдаётся. Ошибка нормализована.
Консоль не сериализует cookie/token/raw provider error. Макет и SCSS не меняются018.

## Покрытие FR/SC → задачи

| Требование    | Задачи                   |
| ------------- | ------------------------ |
| FR-001–FR-003 | T002–T004,T007–T008,T012 |
| FR-004        | T009–T011,T012           |
| FR-005        | T005–T011,T012           |
| FR-006        | T002–T006,T011–T012      |
| FR-007        | T005–T011,T012–T013      |
| FR-008        | T005–T008,T011–T012      |
| FR-009        | T002–T004,T009–T013      |
| SC-001        | T002–T004,T007–T008,T012 |
| SC-002        | T002–T004,T009–T012      |
| SC-003–SC-004 | T005–T012                |
| SC-005        | T004,T009–T013           |
| SC-006        | T005–T012                |

Содержательное покрытие15/15,100% подтверждено server/fetch/normalize/count10,
current console snapshot/empty/short, request identity/merge/GC/session cleanup,
late results/A→B→A, StrictMode/same-tick, route/cookie и review boundaries.
T001 обеспечивает актуальный контекст; T012–T014 — итоговые проверки/review/отчёт,
а не новые функции. ID без покрытия, дубли T-ID и циклы исполнения отсутствуют.
019 нормативно описывает общие типы, но018 не импортирует отсутствующий UI019.

## C1–C8 и фактический TDD

| Принцип | Итог   | Основание                                                                   |
| ------- | ------ | --------------------------------------------------------------------------- |
| C1      | Passed | Count10/merge/console и остальные решения пользователя сохранены            |
| C2      | Passed | Авторизованная018 отделена от UI019/send/receiving и pure025                |
| C3      | Passed | Отдельная авторизация кода из переписки, повторный gate не нужен            |
| C4      | Passed | Git mutations отсутствуют, чужие изменения/index сохранены                  |
| C5      | Passed | Зависимости установлены ранее пользователем; новых установок/БД нет         |
| C6      | Passed | Exact feature, cookie/scope, фиктивные сообщения и реквизиты                |
| C7      | Passed | Поведенческий Red до Green, реальные проверки, стабильный read-only analyze |
| C8      | Passed | Minimal shared core/Query RAM; без нового persistence/UI/pagination         |

Первый Red handler/provider/fetch/merge/lifecycle:22 Failed/1 Passed до кода.
React hook/controller Red:5 Failed при работающей fixture-сборке, отсутствовали
HTTP/console. Ошибки sandbox/настройки и missing import не объявлялись Red.
Actual route E2E создан после handler Red как wiring/regression; отдельного
искусственного Red откатом готового поведения не было.

Первый общий Green обнаружил ошибку fixture equal-timestamp order, два неверных
type narrow и innerText, схлопывавший пробелы JSON. Эти postcode failures честно
отделены от исходного Red. Первый E2E82/6 обнаружил реальный Origin bug; новые
4 регрессионных теста дали Red4/4 до исправления и Green4/4 после Host guard.
Вслед за ним общая integration/E2E прошла полностью. Fixtures не маскируют
ошибку заменой127.0.0.1 наlocalhost, source контрактные ожидания независимы.

| Проверка                                              | Фактический итог                   |
| ----------------------------------------------------- | ---------------------------------- |
| npm run test:integration                              | 198 Passed                         |
| npm run test:query                                    | 18 Passed                          |
| npm run test:e2e                                      | 88 Passed; production build Passed |
| npm run typecheck / lint / lint:styles / format:check | Passed                             |
| Prettier документов с --ignore-path NUL               | 28 файлов Passed                   |
| Локальные Markdown-ссылки018–025 и общих документов   | Passed; broken links0              |
| git diff --check / staging                            | Passed; index не изменялся         |

Команды и Red/Green представлены в [verification.md](verification.md).
Query18 и Stylelint после успешного общего прогона не повторялись: последующие
изменения затронули только серверный Origin guard и документы. После этого
исправления повторены полные integration/E2E и затронутые статические проверки.
Проверка source/tests отдельно от docs выполнена фактически, а не заменена
словесным ревью.

## Метрики, непроведённые проверки и решение

| Метрика                                             | Значение       |
| --------------------------------------------------- | -------------- |
| User stories / FR / SC                              | 2 / 9 / 6      |
| Задачи завершены / незавершены                      | 14 / 0         |
| Покрытие / непокрытые FR-SC                         | 15/15,100% / 0 |
| Повторяющиеся T-ID / непривязанные задачи           | 0 / 0          |
| Существенные дубли / неоднозначности / противоречия | 0 / 0 / 0      |
| Open findings / blocking product questions          | 0 / 0          |

Ручное ревью пользователя и реальная GREEN-API history — NotRunExternal:
все исполняемые проверки использовали синтетические данные и fake provider.
Последние10 не обещают полноту Telegram и получение каждого сообщения за время
отсутствия. Память теряется после перезагрузки; пагинация, UI истории, вложения,
отправка/SSE/ACK, размещение и proxy не выполнялись в018.

Все обязательные018 проверки Passed,14 задач завершены. Изменения готовы к ревью.
Следующий отдельно разрешаемый шаг019 — отображение истории; код не запускается
этим отчётом. Общий commit title: **feat: load chat history and refine conversation controls**.
Коммит и staging не выполнялись.
