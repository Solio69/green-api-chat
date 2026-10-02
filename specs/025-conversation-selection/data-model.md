# Модель: выбранная переписка

**Статус**: реализованная модель 025; поведение проверено integration/query/E2E.

## Данные

- ConversationTarget: {chatId:string,label:string}. chatId подтверждён списком
  либо успешным поиском; label фактическая доступная подпись или chatId.
- ConversationSelection: {target:ConversationTarget|null,accessId:number,
  selectionEpoch:number,mobilePanel:'list'|'conversation'}.
- Начальное состояние: target=null, оба счётчика 0, mobilePanel='list'.
- Область состояния: один экземпляр под QueryProvider текущего connectionScope.
  Никакого URL/localStorage/cookie persistence для выбора.

## Переходы

| Действие                                                 | target                                  | accessId              | selectionEpoch | mobilePanel  |
| -------------------------------------------------------- | --------------------------------------- | --------------------- | -------------- | ------------ |
| openConversation(A), сейчас нет выбора или другой chatId | A                                       | +1                    | +1             | conversation |
| openConversation(A), сейчас A                            | A, обновить фактическую подпись         | +1                    | без изменения  | conversation |
| showChatList()                                           | сохранить                               | сохранить             | сохранить      | list         |
| closeConversation(), target есть                         | null                                    | сохранить             | +1             | list         |
| closeConversation(), выбора нет                          | null                                    | сохранить             | сохранить      | list         |
| Resize                                                   | сохранить                               | сохранить             | сохранить      | сохранить    |
| Завершение подключения                                   | наружу target=null, действия недоступны | не публиковать старый | не переносить  | list         |

После смены scope новый keyed provider начинает новое начальное состояние.
Поздние ответы других feature не вызывают openConversation. Все методы проверяют
session.isActive перед публикацией; close скрывает данные синхронно согласно 014.

## Интеграция

018/019 получают только выбранный chatId/accessId. 021 получает исходный chatId,
selectionEpoch и свою editorRevision: очистка определяется сменой/закрытием,
поздний результат обновляет данные исходного чата без изменения выбора.
023 сохраняет входящие данные и строки списка без openConversation.

Нет собственных копий PersonalChat[] или Message[] в этой модели. Локальные
записи нового отправленного/входящего чата относятся к общему Query-кешу 019,
а не к выбранному target. Закрытие выбора их не удаляет.
