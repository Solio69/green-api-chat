# Verification: Vercel notification polling

2026-10-03. Completed / PassedSynthetic. Только фиктивные реквизиты и provider.
Реальные Telegram, очередь/настройки GREEN-API, аккаунт Vercel и публикация не затронуты.

## Red → Green → Refactor

| Этап | Команда / результат |
| --- | --- |
| Red до продуктового кода | npm run test:integration -- vercel-notifications.spec.ts: 1 failed,3.16с; независимый receive ожидает200, текущий handler возвращал409 без owner. Это behavioral failure, не import/env error. |
| Green затронутых контрактов | npm run test:integration -- vercel-notifications.spec.ts polling-connection.spec.ts send-message.spec.ts message-send-controller.spec.ts notification-provider.spec.ts unread-notifications.spec.ts:119 passed,7.1с |
| Refactor regression | npm run test:integration:353 passed,28.8с |
| React/Query/browser locks | npm run test:query:45 passed,2.7мин |
| Production build и E2E | npm run test:e2e:next build успешен,109 passed,1.3мин |
| Quality | npm run lint, lint:styles, typecheck:Passed |
| Formatting | npm run format:check:Passed; все файлы соответствуют Prettier |
| Read-only анализ | Полный inventory/hash и C1–C8 в analysis.md |
| Настоящий Vercel/Telegram smoke | NotRun, operator-only |

При промежуточном Green найден и исправлен синтаксис миграции send tests.
Первичные lint/typecheck выявили import order/unused и test typing; исправлены.
Сгенерированный .next/dev/types/validator.ts ссылался на удалённые маршруты;
удалён только этот cache-файл, route types пересозданы штатным next typegen.
Итоговые успешные проверки приведены выше; ошибки не выданы за Passed.

## Покрытие поведения

- 27 серверных сценариев: независимые receive/ACK, HMAC tamper/scope/expiry/secret,
  replay и потерянный delete response, пустая/иная/та же голова, damaged event,
  Origin/scope/body/config/session/provider errors и отмена. Delete не зависит от registry.
- 14 клиентских сценариев: apply-before-ACK, отсутствие параллельного следующего receive,
  dedup/unread, pending ACK retry, expired proof, recovery/history, busy/unsupported locks,
  late acquisition/response, StrictMode, session/scope close и manual retry.
- 3 новых сценария настоящего браузера: вторая вкладка блокируется, после закрытия
  первой retry работает и отправляет; reload освобождает lock; отсутствие Web Locks
  показывает ограничение без запросов API.
- Общая регрессия сохраняет history/cache/unread/statuses/send guards/outcomes,
  авторизацию, logout, поиск, адаптивность и клавиатурный сценарий.

Удалены12 integration suites, проверявших неприменимые registry/HMR/grace/drain/SSE
контракты. Они заменены проверками текущего HTTP/ACK/client runtime. Provider,
normalization/cache/unread/status suites сохранены. Количество тестов не используется
как процент покрытия; FR/SC→T-ID отражены в tasks/analysis.

## Review и превью

CODING_RULES.md и CODE_STYLE.md прочитаны перед кодом и повторно после Green.
Повторно проверены именованные аргументы, импорт/константы, границы модулей,
отмена, обработка поздних ответов, отсутствие секретов, неприменимые состояния.
Controller сокращён примерно с540 до347 строк; транспорт, Web Lock, HMAC и
route adapter выделены по роли. Удалены server leases/registry и лишние React updates.
Семантические protocol values — constants; schema keys и литералы Next static
analysis оставлены по правилам. Независимые HTTP ожидания tests не импортируют
проверяемые значения из production constants.

Query генерирует6 превью:1280/390/320px,light/dark. Просмотрены desktop1280-light
и mobile320-dark: счётчик99+, переносы, mobile back/close и composer соответствуют
текущему макету, overflow не обнаружен. Стили/макет не менялись. Это синтетические
скриншоты, не реальная переписка или деплой.

## Границы результата

Receive/settings deadline 8с, ACK16с, route maxDuration 20с, browser request25с;
один последовательный цикл и abortable backoff. Без открытой вкладки новые запросы
не идут. Уже начатая удалённая операция может завершиться после её закрытия.
Web Locks — один browser origin/connectionScope, без глобального владельца на
разных устройствах/профилях/origins. Отправка одна за раз в текущем клиенте,
без автоматического повтора. Доставка at-least-once; full recovery/exactly-once не заявлены.

Пользовательский staged README сохранён в индексе; рабочая копия документа
обновлена по архитектуре/деплою. Git mutations и установка пакетов не выполнялись.
Следующий операторский шаг: [Vercel quickstart](quickstart.md).
