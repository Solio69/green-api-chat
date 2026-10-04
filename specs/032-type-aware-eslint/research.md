# Исследование async lint 032

Дата: 2026-10-03. Диагностический ESLint API override не менял конфиг проекта.
Установленный eslint-config-next/typescript уже подключает parser/plugin
typescript-eslint 8.71.0. Новые установки или прямые импорты транзитивных пакетов не нужны.

## Варианты

| Выбор | Преимущество | Цена/риск |
| --- | --- | --- |
| Явные project из 031 | Охватывают все 314 TS-файлов с нужными ambient types | Проверка типов замедляет lint |
| projectService с nearest tsconfig | Автоматический выбор для обычной структуры | Unit/component исключены из ближайшего root; потребуются дополнительные конфиги или allowDefaultProject |
| Только два правила | Находит потерянные Promise и async в sync-контрактах | Не обещает доказательства корректности всей асинхронности |
| no-floating-promises, ignoreVoid: true | Штатная настройка; явное намерение запустить обработанную операцию | void не ловит rejection: нужен аудит владельца ошибки |
| ignoreVoid: false | Запрещает также явные detached операции | Требует лишних catch/исключений для уже обработанных Promise |

Выбраны явные project, no-floating-promises с документированным ignoreVoid:true
и no-misused-promises со всеми стандартными проверками, включая JSX attributes.
Глобальные отключения, blanket eslint-disable и пустые catch ради lint не нужны.
Sync adapters React не меняют await/try/catch внутри операций.

## Аудит диагностических сообщений

Строгий диагностический вариант ignoreVoid:false дал 5 floating и 13 misused сообщений.

| Группа | Владелец результата/ошибки | Действие |
| --- | --- | --- |
| LoginForm, RecipientSearchForm, LogoutButton | Локальные try/catch/finally выставляют ошибку и pending; logout ждёт close до navigation | Синхронный обработчик события вызывает ту же async функцию; никаких новых catch |
| ChatHistoryState, ChatListRecovery, MessageComposerFeedback | useChatHistory/useChats refetch ждут QueryObserver.refetch без throwOnError; ошибка остаётся в query state | Явная event adapter граница |
| NotificationNotice retry | Контроллер ловит transport/lease ошибки и меняет состояние; retry ждёт предыдущий run | Явная event adapter граница |
| QueryCache.onError | handleSessionError сначала close, затем callback router; cancelQueries поглощает отмены | Callback остаётся void, async последовательность внутри сохранена |
| HistoryProbe/QueryProbe/SelectionProbe/SessionOverlayProbe | Те же query refetch/close контракты | Явные sync event handlers |
| ChatHistoryPanel recovery | Query refetch с ошибкой в состоянии | Существующий void сохранён после аудита |
| MessageComposer submit (2 вызова) | createSendController ловит dispatch ошибки и возвращает AttemptResult; submit ждёт send | Существующий void сохранён после аудита |
| notification refresh run | fetchQuery catch оставляет ошибку Query; finally снимает running | Существующий void сохранён |
| notification run.finally | run обрабатывает штатные transport/lease ошибки; finally только снимает runningTask | Существующий void сохранён; транспортная регрессия обязательна |
| browser-tab-lease request | catch(reject) передаёт ошибку наружному Promise | Уже обработано, новых правок нет |
| Node/DOM тестовые pending Promise | catch фиксирует ожидаемую отмену, тест проверяет AbortSignal | Уже обработано |

Аудит не объявляет произвольные ошибки программирования безопасными.
При изменении контракта вызванной функции её callers и detached операции
должны пересматриваться; это ограничение void и статического анализа.

## Источники

- [no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/)
- [no-misused-promises](https://typescript-eslint.io/rules/no-misused-promises/)
- [parser project](https://typescript-eslint.io/packages/parser/#project)
- Установленный QueryObserver.#executeFetch: без throwOnError добавляет catch(noop).
- Установленный QueryClient.cancelQueries: Promise.all(...).then(noop).catch(noop).
