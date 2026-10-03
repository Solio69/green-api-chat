# Contract 048: список чатов

1. `model`: normalizeChats сохраняет фильтрацию секретов, типы внешних полей, только персональные записи, порядок и дедупликацию. Валидаторы chatId работают для history/messages/sending/notifications через public model entry. Scope pattern остаётся тем же.
2. `server`: `/api/chats` делегирует `features/chats/server`; форма JSON, HTTP status, cookie lifecycle и provider retry/deadline не меняются. История и её route остаются в conversation/history.
3. `application`: Query options сохраняют key, stale/gc, retry/refetch и cancellation. Overlay хранит незавершённые факты, reconciles подтверждённые ID и даёт не более одной строки на chatId. Повторный выбор текущего чата по-прежнему открывает историю.
4. `ui`: различаются initial pending, empty, hard error и refresh error с сохранёнными строками. Кнопка retry и её busy state остаются; строки доступны с клавиатуры, selected state и 99+ с точным ARIA count сохраняются. `ChatUnreadBadge` общий для чатов и conversation.
5. Публичные входы model/application/server/ui раздельны. QueryProvider не импортирует chats, клиент не импортирует server runtime; другие модули используют только соответствующие публичные входы chats.
