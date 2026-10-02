# Research: история выбранного чата и кеш

**Дата**: 2026-10-02. Spec согласована; реализация отдельно разрешена 2026-10-02 строго по макету.

## Факты и решения

Текущий стек: Next 16.3.7, React 19.3.0, Query 5.104.0, TypeScript 5.9.3,
Node 24.x. Тестовые уровни уже доступны: Playwright integration/query/E2E.
Новые пакеты не нужны. useChats возвращает PersonalChat[]; ChatList использует
name/username/phone/chatId в ChatListItem; session labels добавлены отдельно от profile в общем overlay 019. 025 реализует target/accessId/mobile оболочку, 018 — свежий запрос count: 10, Query message-cache и консольный снимок. Эти шаги закоммичены пользователем; 019 расширяет существующее ядро, не реализует получение заново.

Пользователь согласовала count: 10 при каждом открытии, retention+merge в Query,
«Неподдерживаемое сообщение», перенос подгрузки. Официальный
[GetChatHistory](https://green-api.com/telegram/docs/api/journals/GetChatHistory/)
документирует chatId/count и смешанные типы без cursor/offset. Поэтому в 019
нет страницы 20, scroll-fetch или обещания полной истории. Count относится к
API response, не ограничивает число уже известных сообщений.

## Рассмотренные варианты

| Вопрос                   | Варианты                                                    | Выбор и причина                                              | Ограничение                                          |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| История после возврата   | Сброс свежие десять сообщений / объединение / постоянная БД | Пользователь выбрал объединение в памяти Query               | Перезагрузка теряет кеш; промежутки не гарантированы |
| Хранение новых сообщений | useState каждого UI / единый Query key                      | Общий message-cache для history/live/accepted                | Нужны monotonic merge и scope guards                 |
| Факты новых чатов        | Менять provider DTO / отдельный session overlay             | Прежний PersonalChat[] плюс derived union и отдельные labels | Label не является реальным name                      |
| Отказы статусов          | Вымышленный bubble / общий issue                            | Временный latest issue по chat/connection; 024 отображает    | Это не журнал и не повтор отправки                   |
| Unknown media            | Пропуск / placeholder / download                            | Согласованный placeholder без загрузки                       | Не показываем вложения                               |

## Технические основания

[QueryOptions](https://tanstack.com/query/latest/docs/framework/react/reference/interfaces/QueryOptions)
документирует gcTime: Infinity, иначе GC обычно удаляет inactive data.
Defaults должны задаваться до первого setQueryData. Удержание until close
обосновано пользовательским выбором сохранять сообщения; для истории нет
самостоятельного fetch в merged key. Временные request keys и политику сети
владеет 018. [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient)
требует immutable updates и предоставляет cancel/clear; сверены установленные
query-core queryClient.ts/removable.ts. Новую библиотеку store не добавляем.

[chatId](https://green-api.com/telegram/docs/api/chat-id/) описывает положительные
личные/отрицательные групповые идентификаторы и legacy phone aliases отправки.
Общий структурный isPersonalChatId 018 сохраняет opaque compatibility 014 и
исключает явно известные group/alias формы. Он не доказывает существование
получателя: источник 025 должен быть GetChats type:user/CheckAccount, а upstream
проверяется server adapter. Конверсия в Number и отправка по phone alias не нужны.

Root согласовал helper ownership и порядок: 025 → 018 → 019 → 022 → 023 → 020 → 021 → 024.
019 создаёт apply/add/overlay/status-issues memory foundation, но не вызывает
реальные SendMessage/ReceiveNotification. 022 создаёт server parser уведомлений,
023/021 применяют факты,024 отображает статусы/общие ошибки. Это устраняет цикл
«принятая отправка нуждается в ещё не выполненном 024».

Early status facts: TTL 300000ms/max 1000, exact duplicate не продлевает время,
новый более сильный факт обновляет observedAt; lazy cleanup/injected clock.
Положительный status монотонен. Противоречивый failure возвращает issue с
реально наблюдавшимся кодом, а не придуманным статусом. Два разных failures
сохраняют первый message failure и публикуют общий issue второго; root/receiving
сверяют ту же таблицу. Реальный parser/status UI не входят 019.

## Проверка макета и текущего кода

Прочитаны docs/chat-ui-spec.md UI-012/UI-014/UI-016, src/app/page.tsx,
ChatWorkspace/ChatList/ChatListPanel, QueryProvider, create-query-session,
use-chats, get-query-scope и contracts 014/025. Header/Pane остаются 025;
019 подключает содержание через серверный ReactNode slot. Передача callback
из server page в client запрещена: status slot подключается клиентским
MessageList в 024. В 016 composer обеспечит 021; изолированная UI проверка 019
использует fixture нижнего слота и не заявляет реальную отправку.

Доказательства реализации — [verification](verification.md): фактические Red/Green и итоговые проверки.
Изолированная реализация Passed; реальные producers и общий SC-005 — NotRunExternal.

Прочитан установленный query-core replaceEqualDeep: обновление own-ключа `__proto__` обычным присваиванием теряет запись. Изолированный regression тест подтвердил это поведение; memory-префиксы используют structuralSharing:false. Дополнительный Red также подтвердил необходимость contentSources при live без timestamp: поздняя history не должна заменять его текст. Изменения не требуют пакетов, второй базы или изменения публичного DTO.
