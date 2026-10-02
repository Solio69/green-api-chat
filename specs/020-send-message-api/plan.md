# Implementation Plan: серверная отправка текста

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: пользователь согласовал комплект 018–025 2026-10-02.
**Разрешение на реализацию**: CodeAuthorized; разрешена полная feature вместе с 021–024.

## Summary

POST /api/messages требует matching Origin до чтения body и внешних эффектов,
проверяет текущую HttpOnly-cookie, X-Connection-Scope и X-Chat-Owner,
валидирует исходный текст, атомарно резервирует единственную
отправку инстанса в runtime 022 и вызывает SendMessage один раз. Возвращает
accepted/idMessage либо безопасный отказ/неопределённый исход. UI принадлежит 021.

## Considered Options

| Вариант                                     | Преимущества                                          | Ограничения и риски                       | Выбор и причина                   |
| ------------------------------------------- | ----------------------------------------------------- | ----------------------------------------- | --------------------------------- |
| Route Handler + injectable handler/provider | Самостоятельный HTTP контракт, существующий стиль API | Нужны DTO/валидация границ                | Выбран для TDD и cookie API       |
| Server Action формы                         | Меньше клиентского fetch-кода                         | Сложнее отдельный транспорт и чужой UI    | Не выбран                         |
| Синхронный runtime send lock + reject       | Нет очереди повторов, согласован один send            | Только текущий Node-процесс               | Выбран, runtime владеет 022       |
| Автоматический retry/очередь мутаций        | Иногда скрывает временный сбой                        | Неидемпотентная отправка может дать дубль | Запрещён согласованным поведением |

## Technical Context

Node 24, TypeScript, Next 16.3.7 Route Handlers, React 19.3.0, Query 5.104.0,
iron-session 9.0.1, Playwright 1.63.0 уже установлены. Данные только в памяти;
один постоянный Node-процесс. Значения checked по package.json и исходникам,
не по предлагаемой установке. Перед кодом ещё раз прочитать актуальный diff:
пользовательские SCSS/разметка и staging сохраняются.

## Constitution Check

| Принцип | Результат | Основание до проектирования                                                                    |
| ------- | --------- | ---------------------------------------------------------------------------------------------- |
| C1      | PASS      | Поведение, unknown outcome, текст, owner и single send обсуждены                               |
| C2      | PASS      | 020 только сервер, 021 только соединение формы                                                 |
| C3      | PASS      | Spec согласована; код разрешён2026-10-02, итоговый analyze выполняется отдельно                |
| C4      | PASS      | Git/index не меняются; только чтение и документация                                            |
| C5      | PASS      | Новых установок/БД нет; кабинет меняет пользователь                                            |
| C6      | PASS      | Cookie/scope/server-only credentials; фиктивные проверки                                       |
| C7      | PASS      | Red/Green/Refactor и постоянные тесты определены, ядро и HTTP/owner интеграция PassedSynthetic |
| C8      | PASS      | Используется существующий API/Playwright, без Redis/БД/новых пакетов                           |

## Research and Design

- [research.md](research.md): 10s deadline, zero retry, counter Unicode, body.
- [data-model.md](data-model.md): request/result/unknown и временный lock.
- [contracts/send-api.md](contracts/send-api.md): каждый HTTP исход и guard.
- [quickstart.md](quickstart.md): точные команды будущих проверок.
- [checklists/acceptance.md](checklists/acceptance.md): полная автоматическая приёмка PassedSynthetic.
- [Общий комплект](../../docs/messaging-specs.md): единственная рабочая вкладка,
  scope против instance identity; shared model 019 и owner runtime 022/023.

Локальный счётчик 4096 code points не выдаётся за проверенный upstream алгоритм.
Byte limit 64 KiB не применяется к остальным API. Ответы не получают фальшивый
timestamp; время локального принятия создаёт 021 отдельно. Lock держится до
локального settlement, не обещая отменить удалённый commit после timeout.

## Project Structure

Новые файлы:

- src/app/api/messages/route.ts — POST cookie/scope → handler → runtime/provider.
- src/lib/sending/types.ts — SendRequest/AcceptedSend/SendFailure.
- src/lib/sending/constants.ts — send field names, лимиты, безопасные error codes.
- src/lib/sending/read-send-body.ts — bounded stream 65536 bytes, JSON validation.
- src/lib/sending/validate-send-request.ts — поля, UUID, общий personal chat validator,
  trim-пустота и code-point count без изменения содержимого.
- src/lib/sending/handle-send-request.ts — guards, внешняя попытка, error mapping.
- src/lib/green-api/send-message.ts — один POST с deadline/redirect:error.
- src/lib/green-api/safe-identifier.ts — чистая проверка ID без raw/encoded
  реквизитов; серверный caller передаёт secrets, client их не импортирует.
- tests/integration/send-message.spec.ts — adapter/handler/validation/locks.
- tests/e2e/message-composer.spec.ts — реальные HTTP cookie/methods/owner/late cases.
- tests/e2e/fixtures/send-scenarios.json — фиктивные результаты поставщика.
- specs/020-send-message-api/verification.md — фактические Red/Green/review.

Изменённые файлы:

- src/lib/green-api/constants.ts — только SEND_MESSAGE_METHOD, существующий timeout.
- src/lib/routes/constants.ts — только MESSAGES_API:'/api/messages'.
- src/lib/api/constants.ts — только send error codes upstream_rejected/outcome_unknown;
  shared ownership codes принадлежат 022/023, не переопределяются здесь.
- src/lib/http/constants.ts — PAYLOAD_TOO_LARGE:413 и FORBIDDEN:403 при отсутствии;
  X-Chat-Owner добавляет 023. Существующий HTTP_BODY_LIMIT входа не меняется.
- tests/e2e/fixtures/fake-green-api.ts — только dispatch send-sценариев, существующие
  auth/search/profile/chats сценарии сохраняются.

Зависимости, которыми этот шаг не владеет: src/lib/notifications/receiver-registry.ts
из 022, shared SessionQueryError/session.handleSessionError из 018,
personal-chat validator из 018. 020 не редактирует workspace/поиск/стили.
Общий файл src/lib/chats/validate-chat-id.ts предоставляет isPersonalChatId;
его поддерживает 018, sending повторно не определяет parser.
Чистый safe-identifier создаётся только в 020; 019 использует существующий privacy pattern014.022 normalizer статуса повторно
использует чистый safe-identifier из уже реализованного core020; он не импортирует
Send route/adapter/session и не создаёт runtime цикл. Core020 проверен до022,
а HTTP020 подключён после022/023.

## Tasks and Dependencies

Порядок [tasks.md](tasks.md): preflight → integration tests и подтверждённый Red
→ adapter/validation/handler Green → готовые owner tests → route/fixtures → production regression
→ Refactor и итоговая регрессия → acceptance/review/verification.
Реализация guard-интеграции зависит от готового runtime 022; самостоятельные
тесты adapter/handler используют injected guard. Missing import/setup не Red.
В HTTP fixtures владение приобретается по 023, без тестового обхода server guard.

## Verification

Статус: все задачи Completed / PassedSynthetic. Полные результаты — [verification.md](verification.md). Integration —
`npm run test:integration -- tests/integration/send-message.spec.ts`;
HTTP — `npm run test:e2e -- tests/e2e/message-composer.spec.ts`.
Red:63 поведенческих Failed/4 Passed на каркасе; тест доходит
до assertion. Green:67 Passed; Refactor: повтор затронутых тестов
и итоговый набор quickstart. Проверяются zero/one provider calls, scope/cookie,
owner handover/pending, body Unicode, original text, временные ошибки без
cookie removal, user unknown outcome, no secret/raw response/false timestamp.

Stylelint не требуется: SCSS и UI этот шаг не меняет. Typecheck/lint/format и
регрессия login/search/chats выполняются один раз после серии правок. Настоящую
переписку агент не отправляет; manual проверка — только пользователем после 021.

## Post-design Constitution Check

| Принцип | Результат после проектирования | Основание                                                            |
| ------- | ------------------------------ | -------------------------------------------------------------------- |
| C1      | PASS                           | Product choices сохранены, counter/lock обоснованы в research        |
| C2      | PASS                           | Серверная отправка не включает форму/историю/очередь                 |
| C3      | PASS                           | Spec Approved, реализация CodeAuthorized                             |
| C4      | PASS                           | Серверное ядро и документы020; Git/index не менялись                 |
| C5      | PASS                           | Новых установок и external account changes нет                       |
| C6      | PASS                           | Scope+proof+cookie, safe DTO и фиктивные данные                      |
| C7      | PASS                           | TDD63 Red/67 Green; HTTP/owner интеграция PassedSynthetic            |
| C8      | PASS                           | Один adapter/handler/route, shared runtime без второй инфраструктуры |

Технический guard, байтовый лимит и корреляция UUID нужны существующим требованиям
и имеют обоснованные ограничения в research; новое продуктовое поведение не добавлено.
Разрешена полная реализация020–024. Финальный analysis выполняется в отдельном read-only
интервале, полный отчёт сохраняется отдельным действием, не этим планом.

## Complexity Tracking

Один adapter, один handler, один route и общий in-process lock. Не добавляются
БД, broker, remote idempotency, автоматические повторные попытки или второй owner.
Новых продуктовых вопросов нет; несовпадение shared контрактов является
технической ошибкой подготовки и исправляется до анализа.

## Текущая авторизация

CodeAuthorized — все оставшиеся задачи до 024 реализованы по поручению 2026-10-02; HTTP маршрут использует общий runtime 022/023, UI подключён в 021.

## Результат реализации 2026-10-02

**Implementation Authorization**: CodeAuthorized. Прямое поручение пользователя:
«делай все эти задачи до 24 включительно. Интерфейс должен быть выполнен в
соответствии с макетом. Перед написанием кода прочитай правила написания кода
и код-стайл». Правила прочитаны до кода; согласованные продуктовые решения сохранены.
**Verification**: PassedSynthetic — автоматические серверные, React и production
проверки с фиктивным GREEN-API. Реальная операторская проверка: NotRun.
Полные доказательства, фактический TDD и ограничения: [verification](verification.md).
Итоговая согласованность: [analysis](analysis.md). Разрешение не включает удалённые
настройки, настоящие сообщения, установку пакетов или Git mutations.
