# Готовность истории, получения и отправки

**Дата**: 2026-10-03. **Статус**: Completed / PassedSynthetic.
Функциональный комплект018–026 соединён в общий сценарий. Действующая архитектура
размещения и доставки — [027](../specs/027-vercel-notification-polling/spec.md).
Автоматические тесты используют фиктивный provider. Реальные GREEN-API и Vercel
smoke — NotRun, выполняются пользователем после публикации.

## Ответственность и контракты

| Feature | Область |
| --- | --- |
| 018/019 | История count10, Query merge, early facts и локальные чаты |
| 020/021 | Cookie/Origin/scope SendMessage, одна попытка, editor/Enter/IME, ручной повтор |
| 022/023 | Нормализация событий и применение Query/skip/dedup/recovery |
| 024 | Подтверждённые статусы, отсутствие понижения и безопасные ошибки без idMessage |
| 025 | Выбор/закрытие/mobile-return, accessId/selectionEpoch |
| 026 | Счётчики уникальных новых входящих вне открытого диалога |
| 027 | Stateless receive/settings/ACK, signed proof, browser Web Lock и bounded polling |

Действующие [HTTP](../specs/027-vercel-notification-polling/contracts/notification-http.md)
и [client](../specs/027-vercel-notification-polling/contracts/notification-client.md)
перекрывают предположения022/023 о SSE и постоянном процессе. Серверного registry,
send lease, Redis и БД нет. Старые verification — результаты указанного в них
прогона, а не подтверждение текущего runtime.

## Проверки текущего комплекта

| Проверка | Результат |
| --- | --- |
| Behavioral Red027 до кода | 1 expected failed: receive409 вместо200 |
| Green затронутых контрактов | 119 passed |
| Полный integration | 353 passed |
| React/Query и две реальные вкладки | 45 passed |
| Production build + E2E | Сборка успешна, 109 passed |
| ESLint/Stylelint/TypeScript | Passed |
| Prettier | Passed |
| Read-only анализ | Результат в analysis027 |
| Реальные сообщения/настройки/очередь/деплой | NotRun |

Ревью и рефакторинг выполнены после повторного чтения правил. Удалены зависимости
от процессной памяти, состояния и повторные React updates; устаревшие тесты
registry/SSE заменены контрактами независимых экземпляров/ACK и клиентского цикла.
Provider, normalization, cache, unread, send guards и outcomes сохраняют покрытие.
Превью desktop1280 и mobile320 проверено по синтетическим скриншотам светлой/тёмной темы;
макет не менялся. Полное доказательство: [verification027](../specs/027-vercel-notification-polling/verification.md).

## Публикация

Vercel GitHub import, Node24, только серверный SESSION_PASSWORD; после изменения
переменной Redeploy. [Инструкция](../specs/027-vercel-notification-polling/quickstart.md).
После публикации пользователь проверяет вход → история → отправка → ответ → статус
→ выход и освобождение вкладки. Web Locks действует лишь в одном origin/scope
одного браузера; разные устройства и окружения могут конкурировать за очередь.
Новых запросов без вкладки нет; полное восстановление истории и exactly-once
не заявляются. Git/index и реальные настройки агент не изменяет.
