# Contract: выбор и оболочка переписки

**Владелец**: 025. **Статус**: реализован и проверен в границах 025. История/отправка 019/021 — NotRun до интеграции.

## Публичный интерфейс

src/components/ConversationSelectionProvider/index.ts экспортирует провайдер
и useConversationSelection. Провайдер требует действующий QueryProvider и
использует существующие isActive/subscribe из публичного QuerySession014.
Расширение lifecycle018 не является предпосылкой функционального выбора.

useConversationSelection() возвращает target, accessId, selectionEpoch,
mobilePanel и методы openConversation(target), showChatList(), closeConversation().
Переходы строго соответствуют [модели](../data-model.md). Потребитель вне
провайдера получает понятную ошибку разработки, а не отдельный независимый выбор.

openConversation принимает непустой подтверждённый chatId, а не телефон или
username, которые ещё требуется искать. label пустой → chatId. Каждый вызов
пользователя увеличивает accessId; StrictMode не создаёт второй вызов.

## Компоненты и граница серверного рендера

- ChatWorkspace становится клиентской оболочкой, сохраняет account/search/chatList
  ReactNode и добавляет необязательный conversation:ReactNode. Серверный
  src/app/page.tsx остаётся серверным; в 025 сеть и профиль не переписываются.
- ConversationSelectionProvider оборачивает слоты и ConversationPane.
- ChatListPanel/ChatList подключают выбор подтверждённого PersonalChat через
  семантическую кнопку в ChatListItem; не создают Query-копию списка.
  ChatListItem получает chat:PersonalChat, isSelected и onSelect(target);
  фактический label и инициал вычисляются внутри строки. Key chatId остаётся у map в ChatList.
  В 019 появится необязательный labelsByChatId для локальных записей; выбор берёт
  тот же отображаемый label, не превращая его в выдуманный PersonalChat.name.
  ChatListRecovery представляет ошибку и кнопку повтора через props; Query,
  состояние retryErrorCode и повторный refetch остаются у ChatListPanel.
- RecipientSearchForm.handleWrite при found вызывает openConversation({chatId,
  label}); не повторяет поиск и не добавляет запись списка.
- ConversationPane/ConversationHeader принадлежат 025, принимают children-слот,
  показывают фактическую подпись, «Чаты» и «Закрыть чат». MessageList/ChatHistoryPanel
  и трактовка ответа истории принадлежат 019, composer —021.
- Пока target=null, сохраняется существующий ConversationEmptyState. Пока история
  ещё не получена, наличие выбранного target само по себе не означает пустую
  успешную переписку. Содержимое истории предоставляет только слот 019/fixture.

## Навигация и доступность

В мобильном режиме открытие переводит фокус в заголовок выбранной переписки;
«Чаты» возвращает фокус на доступное действие списка, крестик — в список/поиск.
Закрытие удаляет из tab-порядка скрытую панель. При resize сохранённый выбор
не теряется; если focused элемент стал скрыт, фокус переводится в видимую панель
без нового openConversation. Действия имеют существующие согласованные подписи.
Фокус вне рабочей области не перехватывается при изменении размеров панелей.

Приватный useWorkspaceFocus возвращает refs sidebar/pane/heading и обработчики
React onFocusCapture/onBlurCapture. ResizeObserver подписан на панели и отключается
при cleanup; эффект навигации сохраняет зависимости target/accessId/mobilePanel.
useEffectEvent используется только эффектами и обработчиком наблюдателя для
доступа к актуальным значениям. Наблюдение не меняет выбор и не вызывает сеть.

## Изоляция и побочные действия

Выбор не вызывает SendMessage, GetChats, GetChatHistory, ACK или DeleteNotification
самостоятельно. Событие accessId наблюдает отдельно интегрированная 018/019.
Мобильный возврат сохраняет target и оба счётчика, значит не очищает ввод 021.
Смена chatId/close изменяет selectionEpoch и очищает ввод через 021, не отменяя
принятую provider-отправку. Ответы истории/отправки/SSE не меняют выбор.

## Проверяемые примеры

A(1,1) → A(2,1) → B(3,2) → mobile-list(3,2) → B(4,2) → close(null,4,3).
Счётчики показаны как accessId/selectionEpoch; при начальном отсутствии выбора
первое A получает 1/1. Повторное close без выбора ничего не увеличивает.
В тесте к каждому действию привязан один пользовательский click, сетевые запросы
не появляются до отдельной интеграции; закрытие не удаляет Query-данные.
