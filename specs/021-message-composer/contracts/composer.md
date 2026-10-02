# Contract: ввод и наблюдаемые состояния

Владелец: 021. Компонент MessageComposer и его constants/index в
src/components/MessageComposer/. Расположение/оформление соответствуют
UI-016–018 и действующему макету; разметка не переносится из DOM-скрипта макета.
MessageComposer отвечает за разметку; локальный useMessageComposer держит текущее состояние редактора и обработчики. MessageComposerFeedback отдельно отображает ожидание, отказ и действие проверки истории; его тексты и SCSS лежат рядом с компонентом. Структура и токены согласованного макета сохраняются.

## Ввод

Выбранный target/selectionEpoch берутся из useConversationSelection 025.
Один text и editorRevision, без per-chat Map. На edit увеличивается revision;
на смену chatId или close текст очищается и revision увеличивается. Повторное
open того же чата/refetch истории меняет accessId, не очищает текст. Mobile
showChatList сохраняет target/ввод. Close/switch доступны при pending.

Submit: preventDefault → not composing → target+active owner+session → not
pending → trim-пустота/code-point<=4096 → send snapshot. Содержимое оригинально,
без trim. Enter вне IME вызывает submit; Shift+Enter добавляет строку. При IME
композиции Enter не отправляет. Кнопка и keyboard используют одну функцию, чтобы
doubleclick/Enter+click не обошли общий latch. Нельзя превратить поиск в SendMessage.

Поле текущей pending попытки заблокировано через readOnly и aria-busy: текст нельзя изменить, но фокус и подсветка сохраняются при Enter; кнопка отправки любого чата
заблокирована. Другой выбранный чат может получать новый ввод, но не отправлять
до завершения попытки. Нерабочая вкладка показывает ограничение 023 и не имеет
доступной отправки. Field/busy state не заменяет server proof.

## Результат

- До подтверждения нет optimistic пузыря. Отдельное ожидание формы доступно
  screen reader; pending исходного чата не выдаётся за отправку нового получателя.
- accepted/idMessage добавляется через controller в исходный messages cache.
  Очистка текущего текста допускается только при совпадающих chatId,
  selectionEpoch и editorRevision snapshot. Другие сообщения не очищаются.
- Подтверждённый отказ сохраняет исходный текст только в прежнем открытом
  редакторе; сообщение ошибки не содержит upstream raw description/секретов.
- unknown сохраняет текст при той же редакции/открытом чате, предлагает
  «Проверить историю». Действие использует существующий useChatHistory.refetch()
  с count:10 для актуального выбранного чата; его ошибка не создаёт SendMessage.
- Ручная «Повторить отправку» сопровождается текстом о возможном дубликате.
  Никакого автоматического повтора после refresh/reconnect/ошибки нет.
  Прочтение/отсутствие похожего текста не меняет outcome попытки.
  Отказ новой попытки до dispatch (например, send_in_progress) не доказывает
  отсутствие первой unknown отправки и не отменяет предупреждение о её исходе.
- SSE/история могут дать фактические сообщения отдельно; форма не сопоставляет
  unknown отправку с ними по тексту, времени или позиции.

Тексты для а11y: связанный label textarea, accessible send name, live status,
ошибка связана через aria-describedby. Подсказка Enter/Shift+Enter доступна на
mobile и focus. Не использовать цвет как единственное различие статуса;
delivered/read и failed/noAccount — факты 024, не таймеры этого компонента.
Превышение 4096 code points отмечается aria-invalid и error border/focus shadow;
после исправления текста атрибут и красный контур снимаются. Сетевой unknown
не означает невалидность текста. Ожидание объявляется через визуально скрытый role=status и не увеличивает высоту формы; ошибки остаются видимыми с error token. Однострочное поле43px имеет явную типографику и отступы, вмещающие строку без скролла. При переносах сохраняется прокрутка с тонкой полосой без системных стрелок.
Действия восстановления используют existing-token recovery-button mixin; область
кнопки проверки истории не меньше44px. Форма/круглая отправка сохраняют43px макета.

## Новая запись списка

Controller вызывает rememberPersonalChat только после accepted. Данные actual
target.label отдельны от provider metadata; поиск/открытие не создаёт overlay.
Повторный GetChats без нового чата не удаляет accepted fact текущей session;
подтверждённый GetChats объединяется по chatId, без второго элемента.
Отсутствие текущего выбранного чата из нового списка не отменяет отправку.

## Проверка

После разрешения кода real React tests: Enter/Shift/IME/empty, two consumers
double submit, switch/close/reopen/mobile, HTTP completion after unmount,
scope close, owner lost/second tab, partial status/history before accepted,
unknown → history → manual repeat warning, original Unicode/newline input.
Оформление сравнить с текущим макетом без редизайна. Acceptance: PassedSynthetic; Operator NotRun.
