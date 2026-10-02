# Contract: факты личных чатов текущего сеанса

**Owner**: 019, общий слой для 021 и 023. GetChats HTTP DTO и политика Query 014 не меняются. Этот контракт не запускает отправку или чтение очереди.

## Интерфейсы

`src/lib/chats/session-chat-facts.ts`:

```typescript
rememberPersonalChat({ session, chatId, label, source, profile }: {
  session: QuerySession
  chatId: string
  label: string | null
  source: 'accepted' | 'incoming'
  profile?: PersonalChat
}): void

reconcileSessionChats({ session, providerChats }: {
  session: QuerySession
  providerChats: PersonalChat[]
}): void
```

`src/lib/chats/use-session-chat-labels.ts`:
`useSessionChatLabels(): Readonly<Record<string, string>>`.
Форма PersonalChat остаётся прежней из 014. Label найденного получателя не
превращается в выдуманное name/username/phone. profile допускается лишь с тем
же chatId и фактическими нормализованными полями поставщика. Без profile
факт создаёт PersonalChat с null в name/username/phone и отдельной подписью.
Структура ключей не допускает prototype pollution; произвольный chatId не
используется как незащищённое присваивание свойству обычного объекта.

## Query и представление

Ключ: `['session-chats', connectionScope]`; gcTime: Infinity задаётся до
первого применения. Значение содержит factsByChatId и labelsByChatId.
Факт добавляется только после принятой отправки или проверенного входящего
сообщения; поиск, «Написать» и чтение истории его не создают. Helper проверяет
session.isActive и текущую область; после close ничего не восстанавливает.

Provider-данные остаются под `['chats', scope]`. useChats возвращает прежний
PersonalChat[] как derived union по chatId: порядок provider сохраняется,
неподтверждённые факты дополняют список в стабильном порядке первого появления.
Реальные ненулевые поля profile/provider приоритетны. Компонент не копирует
union в useState. ChatList получает optional labelsByChatId и передаёт fallbackLabel в существующий ChatListItem; ChatListItem выбирает
name || username || phone || labelsByChatId[chatId] || chatId. 025 может
использовать тот же fallback для target.label; target не получает fake profile.

reconcileSessionChats вызывается только после успешного GetChats, из общего
queryFn 014 до возврата нормализованного списка. Появившийся provider chatId
поглощает pending fact без второй строки. labelsByChatId сохраняется до close,
чтобы подтверждение списка с неполным профилем не теряло известную подпись.
Пустой успешный ответ и ошибка refresh не удаляют неподтверждённые факты.
Настройки staleTime/gcTime/refetch списка 014 сохраняются. При ошибке списка
существующая error card остаётся, но рядом сохраняется известный union,
включая подтверждённые accepted/incoming факты; ошибка не скрывает новый
локально известный чат. При отсутствии union показывается только прежняя
ошибка. Данные не объявляются свежим успехом; редизайн error card/списка не нужен.
reconcile не вызывается во время render.

## Источники и закрытие

021 передаёт source: accepted после HTTP idMessage, label выбранного target.
023 передаёт source: incoming после проверенной нормализации сообщения,
label/profile только из фактических разрешённых данных. Сообщение и факт
чата синхронно применяются до ACK; отдельный GetChats не задерживает ACK.
Повтор incoming/accepted одного chatId не создаёт второй факт.
Выход/смена подключения очищают и provider-кеш, и overlay/подписи.

## Проверки

Accepted/incoming одного chatId; отсутствие в GetChats; пустой/error refresh;
появление provider без дубля; отдельный label без fake name; неизвестные поля
профиля; чужой scope/close; безопасные строковые ключи; стабильный порядок;
Query GC и неизменность политики 014. Изолированные проверки Passed; producers021/023 проверены совместно: PassedSynthetic; реальный GREEN-API — NotRun. См. [verification](../verification.md).
