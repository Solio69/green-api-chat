# Verification: Счётчики новых сообщений

Дата: 2026-10-03. Статус: Completed / PassedSynthetic.

## TDD и итоговые проверки

| Проверка / команда | Результат и основание |
| --- | --- |
| Red: npm run test:integration -- unread-notifications.spec.ts | Подтверждён: 1 тест Failed из-за отсутствия unread cache (undefined вместо unreadByChatId с одним ID); существующий applyNotification успешно обработал событие. Ошибок импорта/окружения в Red нет |
| Green: та же команда после реализации | Passed, 8 сценариев: уникальность, очистка, видимость, история, типы событий, scope/owner, lifecycle |
| npm run test:integration -- unread-notifications.spec.ts notification-cache.spec.ts | Passed, 10 тестов после финального чистого рефакторинга строковых типов в обработчике |
| Refactor | UI-тексты рядом с badge, semantic constants/tokens, небольшие компоненты и отдельные hooks, named handlers, единый Query RAM; тесты сохранены |
| npm run test:integration | Passed, 350 тестов, 26.9 s |
| npm run test:query | Passed, 42 теста, 1.9 min, включая 11 новых; после настройки мобильных промежутков повторены все 11 новых сценариев; после сокращения заголовка повторены 3 затронутых проверки |
| npm run test:query -- unread-indicators.spec.ts | Passed, 11 тестов после финального исправления шапки и проверки кнопок в одной строке |
| npm run test:query -- unread-indicators.spec.ts --grep "320px\|long chat" | Passed, 3 затронутых проверки после последнего SCSS-рефакторинга сокращения заголовка; обе темы и длинное имя |
| npm run test:e2e | Passed, 109 тестов; webServer выполнил npm run build, production Turbopack сборка и TypeScript успешны |
| npm run test:e2e -- chat-workspace.spec.ts chat-list-ui.spec.ts conversation-selection.spec.ts message-composer.spec.ts | Passed, 18 затронутых UI-сценариев и новая production-сборка после последнего SCSS-рефакторинга |
| npm run lint | Passed, 0 errors / warnings |
| npm run lint:styles | Passed |
| npm run format:check | Passed |
| npm run typecheck | Passed |
| git diff --check и предкоммитное ревью | Passed; staging пуст, Git mutations не выполнялись |

## UI preview и ревью

Реальные компоненты проверены в Chromium с fake Receive → SSE → ACK → Delete. Светлая/тёмная тема на 1280, 390 и 320 px. Скриншоты вариантов просмотрены; badge справа от названия, ноль скрыт, 100 показано 99+, accessible description содержит точные 100. Длинное имя сокращается визуально, полное доступное имя сохранено; горизонтального overflow нет. На 320 px кнопки «Чаты» и закрытия остаются в одной строке; отступ бейджа задан существующим токеном. Мобильный заголовок сокращается в одной строке, не разрывает слово; повторяемая группа вынесена в truncate-line mixin.

Снимки сохранены в рабочем каталоге чата: unread-preview-1280-light-list.png, unread-preview-1280-dark-list.png, unread-preview-390-light-conversation.png, unread-preview-390-dark-conversation.png, unread-preview-320-light-conversation.png, unread-preview-320-dark-list.png и остальные варианты. Скриншоты содержат только фиктивные данные.

Проверены границы модулей, hooks cleanup/StrictMode, закрытая сессия, отсутствие лишних fetch, прототипные ключи, повтор после очистки, snapshot/history race, неизвестный chat overlay. Badge отвечает за отображение, hook — за видимость, cache — за уникальность и очистку; компоненты не объединяют самостоятельные роли. Magic values вынесены осмысленно; SVG/структурные значения сохранены по CODING_RULES. Новые зависимости, инфраструктура и серверные изменения отсутствуют.

## Устранённые проблемы проверок

Тестовый профиль использует строковый avatarUrl по существующему контракту. Таймаут preview учитывает последовательную синтетическую очередь из 100 сообщений; fixed sleep не используется. Перезагрузка проверяет обнуление RAM независимо от прежней owner grace. Наборы Playwright запускались последовательно для итоговой приёмки: параллельный первоначальный запуск очищал вложенный каталог traces и дал ENOENT, это не ошибка счётчиков. Ошибки промежуточных запусков не представлены как Passed.

## Ограничения и действия пользователя

Счётчик относится только к входящим, обработанным текущим сеансом приложения; reload/выход/смена подключения очищают память. Page Visibility hidden проверено синтетически, физическое переключение вкладок и реальные сообщения Telegram: NotRun, дополнительная операторская проверка. В открытой видимой переписке новые сообщения считаются прочитанными независимо от scroll position по согласованному правилу. История, исходящие и статусы не влияют на число; Telegram read receipts не отправляются.

Нужных установок и операторских изменений для реализации нет. Для ручной проверки открыть А, получить Б и увидеть бейдж; открыть Б для очистки; повторить в фоне и на телефоне. Следующие возможности обсуждаются отдельно.

Название коммита: feat: add unread message counters to chat navigation. Коммит не создан.
