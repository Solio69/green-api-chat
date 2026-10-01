# Contract: публичный Query-слой

Статус: контракт реализован и проверен 2026-10-02. FR-007–FR-012, FR-015.

## Provider

Публичный импорт QueryProvider из @/components/QueryProvider. Props: connectionScope:string и children:ReactNode. Authorized ветка серверной главной передаёт key={connectionScope}; внутри один QueryClient на жизнь этого экземпляра. Повторный render его не заменяет. На сервере экземпляры запросов не объединяются. Корневой layout/login/retry не получают провайдер; existing профиль остаётся серверным. Нет suspense query, server prefetch, hydration payload со списком, persistence и Devtools.

Внутренний контекст связывает scope, QueryClient и lifecycle. Нужен nullable доступ для LogoutButton: вне провайдера существующий выход работает без очистки несуществующего кэша. Хук списка требует провайдер и сообщает ошибку разработчика при его отсутствии.

## useChats

Публичный импорт useChats из @/lib/chats/use-chats. Аргументов нет: scope берётся из провайдера, реквизиты никогда не передаются.

```typescript
type ChatsState = {
  data: PersonalChat[] | undefined
  isPending: boolean
  isFetching: boolean
  error: ChatsQueryError | null
  refetch: () => Promise<void>
}
```

До первого ответа data undefined и isPending true. Успешный [] не pending. isFetching охватывает первоначальную загрузку и refresh; UI может выделить refresh по наличию data. Ошибка refresh сохраняет последнее подтверждённое data того же подключения и возвращает error. refetch разрешён и для свежих данных, его Promise не выбрасывает ожидаемую API-ошибку: состояние ошибки доступно в hook; закрытый контекст делает refetch без запроса. После close data undefined, isPending/isFetching false, error null: навигацией/повторным серверным render управляет провайдер. Не подставлять [] вместо undefined.

ChatsQueryError экспортируется из @/lib/chats/types, содержит code и status (для сетевой ошибки status:null). Контракт type полей соответствует [модели](../data-model.md). UI выбирает текст ошибок самостоятельно; секретные сообщения поставщика отсутствуют.

## Query policy

| Опция                | Значение                   | Результат                                             |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| queryKey             | ['chats', connectionScope] | Дедупликация внутри подключения                       |
| staleTime            | 60000 мс                   | Свежий результат используется без запроса при remount |
| gcTime               | 300000 мс                  | Удаление после пяти минут без потребителей            |
| retry                | false                      | Клиент не умножает серверный retry 429                |
| refetchOnMount       | true                       | При remount stale результата обновление               |
| refetchOnWindowFocus | false                      | Фокус не вызывает API                                 |
| refetchOnReconnect   | true                       | Возврат сети обновляет stale результат                |
| refetchInterval      | false                      | Периодического опроса нет                             |
| enabled              | Подключение активно        | После закрытия нет новых запросов                     |

Опции задаются явно в доменных константах query-слоя. Два потребителя одного незавершённого запроса получают одно выполнение; отдельные подключения имеют отдельные QueryClient. Никакой дополнительный store не копирует data/error/loading.

## Lifecycle и загрузчик

queryFn передаёт signal в GET /api/chats, scope в заголовок; после response/json проверяет signal и активность того же контекста. Загрузчик валидирует JSON/status/code/DTO и scope. Успех с чужой привязкой обрабатывается как connection_changed и не возвращает chats в кэш.

close необратим и идемпотентен: отметить подключение закрытым → уведомить потребителей и скрыть его data → cancelQueries → clear. Loader не возвращает результат закрытого подключения, даже если транспорт игнорирует abort. Источник active-флага один; React подписывается на lifecycle. Не создавать второй глобальный store. Несколько потребителей 401/409 запускают только одно закрытие и одну навигацию.

Успешный POST logout вызывает close до router.replace('/login') и refresh. До подтверждённого успеха подключение активно. Ошибка logout не закрывает кэш и сохраняет существующую ошибку кнопки. При 401 session_required провайдер закрывается, replace login + refresh. При 409 connection_changed закрывается, refresh текущей главной получает профиль/scope действующей cookie; cookie не уничтожается.

Cleanup провайдера отменяет запросы и очищает его клиент. Strict Mode effect replay не должен необратимо закрывать используемый экземпляр: отдельно проверить setup→cleanup→setup. Допустимо отложенное закрытие при unmount с отменой его при повторном setup; новое подключение по key имеет отдельный экземпляр независимо от этой задержки. Решение не заменяет немедленный close на logout/401/409. После окончательного unmount не оставлять подписки и долгоживущий кэш.

## Проверки

QueryObserver/QueryClient: один вызов для двух потребителей, свежесть, stale remount, gc после отписки, запрет interval/focus retries, ручной повтор, сохранение данных при refresh error; fake clock вместо ожидания пяти минут.

Настоящий React/browser: две копии useChats, pending/empty/error/refresh, сигнальная отмена, поздний ответ после close, смена scope А→Б с одинаковым chatId, logout success/failure, 401/409 с одной навигацией, работа LogoutButton вне provider, повторный render без нового клиента и Strict Mode replay. Значения времени в assertions задаются независимыми ожиданиями контракта, не импортом константы, которую проверяют.
