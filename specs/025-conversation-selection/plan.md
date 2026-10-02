# Implementation Plan: выбор и открытие переписки

**Spec**: [spec.md](spec.md). **Дата**: 2026-10-02.
**Согласование spec.md**: пользователь согласовал комплект 018–025 и техническую
подготовку в переписке 2026-10-02.
**Разрешение на реализацию**: получено от пользователя 2026-10-02 только для 025. Реализация и проверки описаны в [verification.md](verification.md).

## Summary

Узкий клиентский Context внутри ChatWorkspace соединяет существующие список и
результат поиска с одним выбранным получателем. Раздельные accessId и
selectionEpoch обслуживают свежую историю и очистку ввода. Мобильная панель не
зависит от размера окна как состояния; CSS сохраняет существующий breakpoint.
Серверные слоты и макет сохраняются. Ни одной сети сообщений в 025 нет.

## Considered Options

| Вариант                             | Преимущества                              | Ограничения                                                 | Выбор     |
| ----------------------------------- | ----------------------------------------- | ----------------------------------------------------------- | --------- |
| Context под QueryProvider           | Один выбор без переписывания server slots | Требуется небольшой контракт                                | Выбран    |
| Протянуть callbacks из page         | Явные props                               | Нарушает обычную сериализацию Server→Client функций         | Не выбран |
| Глобальный Zustand/Query для выбора | Общий store                               | Дополнительная зависимость/смешение UI с серверными данными | Не выбран |

## Technical Context

Next16.3.7/React19.3.0/TypeScript5.9.3, Query5.104.0, существующие SCSS Modules,
Playwright1.63.0 Chromium. Версии прочитаны из package.json, не рекомендация
обновления. Установки нет. ReactNode slots remain server-composed. Референс и
breakpoint680px берутся из текущего UI. Память только текущего scope.

## Constitution Check

| Принцип | Результат до проектирования | Основание                                         |
| ------- | --------------------------- | ------------------------------------------------- |
| C1      | PASS                        | Сценарии открытия/закрытия/pending согласованы    |
| C2      | PASS                        | Только выбор; история/отправка/очередь отдельны   |
| C3      | PASS                        | Спека и реализация 025 разрешены отдельно         |
| C4      | PASS                        | Git только чтение, staging сохраняется            |
| C5      | PASS                        | Пакеты и настройки не устанавливаются             |
| C6      | PASS                        | Явный 025, нет настоящих реквизитов               |
| C7      | PASS                        | TDD выполнен; результаты в verification           |
| C8      | PASS                        | Небольшой Context, существующий макет/инструменты |

## Research and Design

- [research.md](research.md): фактические файлы, варианты и официальные источники.
- [data-model.md](data-model.md): переходы выбора, счётчики и панель.
- [contracts/conversation-selection.md](contracts/conversation-selection.md):
  публичный hook, серверные слоты, focus и границы 018/019/021/023.
- [quickstart.md](quickstart.md): команды проверок и границы приёмки.
- [tasks.md](tasks.md): последовательный TDD и покрытие FR/SC.
- [checklists/acceptance.md](checklists/acceptance.md): собственная приёмка Passed; интеграция019/021 NotRunExternal.

## Project Structure

Пути относительно корня; перечень реализации 025 и согласованного рефакторинга по ревью пользователя.

| Путь                                                                           | Действие/назначение                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| src/lib/conversations/types.ts                                                 | Создать target/selection/action types                              |
| src/lib/conversations/selection.ts                                             | Создать чистые переходы модели                                     |
| src/components/ConversationSelectionProvider/ConversationSelectionProvider.tsx | Создать Context/lifecycle hook                                     |
| src/components/ConversationSelectionProvider/index.ts                          | Публичный экспорт                                                  |
| src/components/ChatWorkspace/ChatWorkspace.tsx                                 | Client wrapper/provider, сохранить server slots, conversation slot |
| src/components/ChatWorkspace/ChatWorkspace.module.scss                         | Только функциональное скрытие панелей существующим 680px           |
| src/components/ChatList/ChatList.tsx                                           | Выбор по chatId, семантическая кнопка/selected                     |
| src/components/ChatList/ChatList.module.scss                                   | Функциональные focus/selected существующими токенами               |
| src/components/ChatListPanel/ChatListPanel.tsx                                 | Передать обработчик выбора/выбранный chatId                        |
| src/components/RecipientSearchForm/RecipientSearchForm.tsx                     | Заполнить handleWrite без нового запроса                           |
| src/components/ConversationPane/ConversationPane.tsx                           | Создать оболочку/children без API                                  |
| src/components/ConversationPane/ConversationPane.module.scss                   | Существующие токены/адаптивная оболочка                            |
| src/components/ConversationPane/index.ts                                       | Экспорт                                                            |
| src/components/ConversationHeader/ConversationHeader.tsx                       | Подпись, back/close/focus                                          |
| src/components/ConversationHeader/ConversationHeader.module.scss               | Сохранить целевой макет                                            |
| src/components/ConversationHeader/constants.ts                                 | Согласованные русские подписи                                      |
| src/components/ConversationHeader/index.ts                                     | Экспорт                                                            |
| tests/integration/conversation-selection.spec.ts                               | Чистые переходы и отсутствие побочных действий                     |
| tests/query/conversation-selection.spec.ts                                     | Реальные Context/слоты/StrictMode/close                            |
| tests/fixtures/query-app/components/SelectionProbe/SelectionProbe.tsx          | Контрактный React стенд                                            |
| tests/fixtures/query-app/components/SelectionProbe/index.ts                    | Экспорт fixture                                                    |
| tests/fixtures/query-app/app/page.tsx                                          | Добавить fixture режим без поломки QueryProbe                      |
| tests/e2e/conversation-selection.spec.ts                                       | Выбор/поиск/mobile/resize/focus                                    |
| tests/e2e/chat-workspace.spec.ts                                               | Сохранить существующую регрессию в новой оболочке                  |
| tests/constants.ts                                                             | Только фиктивные selection fixtures/подписи                        |
| specs/025-conversation-selection/verification.md                               | Создать фактический отчёт после реализации                         |
| specs/025-conversation-selection/spec.md                                       | Сохранить approval, отразить факт только после реализации          |
| specs/025-conversation-selection/tasks.md                                      | Отмечать только выполненные шаги                                   |
| specs/025-conversation-selection/checklists/acceptance.md                      | Записать фактическую приёмку                                       |

Дополнительные фактические пути в том же объёме 025:

| Путь                                                                                                 | Причина                                                  |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| src/styles/_tokens.scss                                                                              | Три используемых размера существующего заголовка макета  |
| tests/fixtures/query-app/components/QueryProbe/QueryProbe.tsx                                        | Обернуть прежний стенд общим SelectionProvider           |
| tests/query/chat-query.spec.ts                                                                       | Сохранить регрессию Query с настоящими кнопками выбора   |
| tests/e2e/chat-list-ui.spec.ts                                                                       | Проверять функциональные строки вместо отсутствия кнопок |
| tests/e2e/recipient-search-ui.spec.ts                                                                | Проверить открытие и закрытие после «Написать»           |
| docs/messaging-specs.md, docs/messaging-readiness.md, docs/project-overview.md, docs/chat-ui-spec.md | Отразить разрешённые025/018 и границу будущих шагов      |

Файлы рефакторинга по текущему ревью:

| Путь                                                                                                                           | Назначение                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| src/lib/conversations/constants.ts                                                                                             | Именованные действия и панели; типы выводятся из констант                                    |
| src/lib/ui/constants.ts                                                                                                        | Общие имена событий браузера, существующая EMPTY_STRING                                      |
| src/components/ConversationSelectionProvider/constants.ts                                                                      | Диагностические сообщения контекста                                                          |
| src/components/ChatWorkspace/constants.ts                                                                                      | Селекторы восстановления фокуса                                                              |
| src/components/ConversationPane/constants.ts                                                                                   | Собственная подпись области переписки                                                        |
| src/components/ConversationBackButton/{ConversationBackButton.tsx,ConversationBackButton.module.scss,constants.ts,index.ts}    | Отдельная мобильная кнопка возврата; существующее оформление                                 |
| src/components/ConversationCloseButton/{ConversationCloseButton.tsx,ConversationCloseButton.module.scss,constants.ts,index.ts} | Отдельная кнопка закрытия; существующее оформление                                           |
| src/styles/_mixins.scss                                                                                                        | Общая реально повторяемая группа стилей двух кнопок                                          |
| tests/e2e/chat-list-ui.constants.ts                                                                                            | Независимые ожидания списка и фикстура длинного списка                                       |
| tests/e2e/search-layout.spec.ts, tests/e2e/account-profile.spec.ts                                                             | Применение тех же правил к аналогичным строкам браузерных проверок                           |
| tests/integration/chats-api.spec.ts                                                                                            | Общая EMPTY_STRING для пустой входной фикстуры                                               |
| tests/e2e/chats-api.spec.ts                                                                                                    | Аналогичные независимые HTTP-ожидания/route/status/фикстуры в константах; общая EMPTY_STRING |
| src/lib/auth/{session,resolve-login,handle-login-request}.ts                                                                   | Именованные параметры и условия существующего входа/cookie без изменения поведения           |
| src/lib/recipients/{handle-search-request,resolve-search,validate-search}.ts                                                   | Те же правила для существующего поиска и валидации                                           |
| src/lib/green-api/{get-state,check-account}.ts                                                                                 | Именованные параметры провайдеров и callback retry; fetch сохраняет внешний контракт         |
| src/app/api/{auth/login,chats,recipients/search}/route.ts                                                                      | Соответствующие вызовы helper с объектом параметров                                          |
| src/app/page.tsx, src/app/api/chats/history/route.ts                                                                           | Только адаптация вызовов session в отдельно разрешённой018; Controller сохранён              |
| tests/integration/{auth-flow,check-account,get-state,login-route,recipient-search,session}.spec.ts                             | Существующие сценарии с именованными параметрами helper                                      |
| tests/e2e/login-form.spec.ts                                                                                                   | Именованная составная проверка геометрии элементов                                           |

Выбор025 не меняет композицию серверной src/app/page.tsx; рефакторинг по ревью меняет только форму вызова session helper. Отдельно разрешённая 018 передаёт
невидимый ChatHistoryController через существующий conversation слот. Если actual UI другой задачи изменился перед кодом, перечитать
его и пересогласовать пересечения технически, не перезаписывать staging.

## Tasks and Dependencies

025 опирается на готовые 014/015/009/016 и существующие isActive/subscribe.
Расширение QuerySession в 018 не требуется для выбора: scope задаёт жизнь
существующего keyed QueryProvider. Поэтому 025 может идти до 018, а затем 018
подключает свежую историю к её событиям. Второго session handler здесь нет.

Порядок: T001 baseline → T002 поведенческий Red переходов → T003 Green модели →
T004 Red настоящих Context/slots → T005 Green wiring → T006 Red mobile/closed
поведения → T007 Green оболочки → T008 проверки совместимости контрактов 018/019/021 на fixture → T009 Refactor/регрессия → T010 ревью и verification.
После каждой Red соответствующая реализация зависит от подтверждённого падения
по целевому поведению, а не от ошибки импорта или настройки.

## Verification

Команды и подробные сценарии в quickstart. SC-002 и SC-004 проверяют собственную
границу 025 через контрактные слоты и тестовый потребитель selectionEpoch.
Настоящие совместные сценарии с HTTP-историей и отправкой проверяются позже
в 019/021; до этого интеграция остаётся NotRun. Она не является зависимостью
завершения изолированного выбора 025 и не создаёт цикл 025→019/021→025.
Чистый рефакторинг опирается на подтверждённые167 integration и проверки025:4 integration,13 Query и14 E2E Passed; искусственный Red не требуется. После завершения серии выполняется общий набор проверок 025 и отдельно разрешённой 018. Проверяем 320/360/390/680/681/768/1280px, focus/tab, resize, longlabel, кнопки;
без редизайна. Тесты логики идут TDD, SCSS сверяется визуально/доступностью.

## Post-design Constitution Check

C1–C8 PASS: решения сохранены, новые продуктовые вопросы отсутствуют, Context
локален, серверные слоты не превращают профиль в клиентский запрос; частичная
готовность не подменяет интеграцию. Реализация 025 разрешена отдельно. Анализ документов и кода выполняется read-only; результат в analysis.md.

## Complexity Tracking

Два счётчика необходимы для разных событий: refresh того же чата и переход,
очищающий ввод. Нет нового глобального хранилища, роутера переписок, сети или БД.

## Управление фокусом

По обсуждению и прямому разрешению пользователя логика вынесена в приватный
src/components/ChatWorkspace/use-workspace-focus.ts. ChatWorkspace подключает
refs и React onFocusCapture/onBlurCapture, сохраняя прежнюю композицию слотов.
Хук разделяет эффект навигации с зависимостями target/accessId/mobilePanel и
подписку ResizeObserver на две панели. useEffectEvent читает актуальный выбор
в обработчике наблюдателя без пересоздания подписки на каждом открытии.
Прямые обращения к window/document и глобальные listeners не используются.
Внешний фокус не перехватывается; потеря фокуса при CSS-скрытии восстанавливается.
Наблюдатель отключается при cleanup. CSS, сеть и модель выбора не изменяются.

tests/constants.ts содержит фиктивное внешнее действие; два дополнительных
сценария tests/e2e/conversation-selection.spec.ts проверяют скрытие поиска и
сохранение фокуса вне workspace. До рефакторинга все шесть сценариев Passed.
После серии проверяются selection/workspace/history HTTP E2E, типы, lint и формат.
Полный предыдущий набор198/18/88 служит baseline, повтор без причины не требуется.

## Строка списка

По прямой просьбе пользователя строка выделена в самостоятельный ChatListItem.
Компонент получает chat:PersonalChat, isSelected:boolean и onSelect(target).
Подпись name/username/phone/chatId, инициал и именованный обработчик выбора
принадлежат строке. ChatList оставляет состояния загрузки/пустоты и map с key chatId.
Нового состояния, сети или поведения нет. Существующие объявления стилей
перенесены в собственный SCSS Module с БЭМ; токены и видимый результат сохранены.

| Путь                                                 | Назначение                                            |
| ---------------------------------------------------- | ----------------------------------------------------- |
| src/components/ChatListItem/ChatListItem.tsx         | Строка li/button, фактическая подпись, инициал, выбор |
| src/components/ChatListItem/ChatListItem.module.scss | Прежние стили строки/аватара/подписи                  |
| src/components/ChatListItem/index.ts                 | Публичный экспорт                                     |
| src/components/ChatList/ChatList.tsx                 | Композиция списка через ChatListItem                  |
| src/components/ChatList/ChatList.module.scss         | Только стили контейнера, списка и его состояний       |

Чистый рефакторинг опирается на предыдущее зелёное покрытие списка и выбора.
Целевой набор: npm run test:e2e -- chat-list-ui.spec.ts conversation-selection.spec.ts;
типы, ESLint, Stylelint, форматирование. Новых тестов структуры компонента нет.

## Блок ошибки списка

По прямой просьбе пользователя представление ошибки и кнопки повтора выделено
в ChatListRecovery. Компонент получает title, description, isBusy, retryLabel,
reservedLabel и onRetry:()=>Promise<void>. Он не читает Query и не хранит состояние.
ChatListPanel сохраняет useChats, retryErrorCode, canRetry, refetch/finally,
выбор текста по коду ошибки и live status. Новый компонент содержит прежнюю
разметку alert/button/SVG и собственные стили, включая резервную подпись кнопки,
анимацию и prefers-reduced-motion. Публичные тексты и HTTP-поведение сохранены.

| Путь                                                         | Назначение                                                |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| src/components/ChatListRecovery/ChatListRecovery.tsx         | Представление ошибки и действия повтора                   |
| src/components/ChatListRecovery/ChatListRecovery.module.scss | Перенесённые стили карточки/кнопки/анимации               |
| src/components/ChatListRecovery/index.ts                     | Публичный экспорт                                         |
| src/components/ChatListPanel/ChatListPanel.tsx               | Передать тексты и обработчик, оставить загрузку/состояние |
| src/components/ChatListPanel/ChatListPanel.module.scss       | Только оболочка, заголовок и live status                  |

Baseline — предыдущие14 list/selection E2E Passed до этого рефакторинга.
Целевой набор после серии: npm run test:e2e -- chat-list-ui.spec.ts;
типы, lint, styles, форматирование. Тесты извлечённой структуры не добавляются.

## Подсказка поиска

По прямой просьбе пользователя повторяемый p выделен в RecipientSearchHint
с props text:string и isHidden:boolean. Два экземпляра получают прежние
PHONE_HINT/USERNAME_HINT и противоположные значения aria-hidden. Контейнер
с hintId и display:grid остаётся в RecipientSearchForm; aria-describedby поля
продолжает ссылаться на него. Перенесённые grid-area и visibility:hidden
сохраняют резервирование высоты и доступное описание текущего режима.
Логика формы, поиск и переключение режима не меняются.

| Путь                                                               | Назначение                                   |
| ------------------------------------------------------------------ | -------------------------------------------- |
| src/components/RecipientSearchHint/RecipientSearchHint.tsx         | Текст подсказки и aria-hidden через props    |
| src/components/RecipientSearchHint/RecipientSearchHint.module.scss | Прежние стили p и скрытого состояния         |
| src/components/RecipientSearchHint/index.ts                        | Публичный экспорт                            |
| src/components/RecipientSearchForm/RecipientSearchForm.tsx         | Два экземпляра с разными props               |
| src/components/RecipientSearchForm/RecipientSearchForm.module.scss | Контейнер hints сохранён; стили p перенесены |

Baseline — полный предыдущий Green88 E2E, включая search UI/layout.
После серии: npm run test:e2e -- recipient-search-ui.spec.ts search-layout.spec.ts;
typecheck/lint/styles/format. Новые тесты структуры не требуются.
