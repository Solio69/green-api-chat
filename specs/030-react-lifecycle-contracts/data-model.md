# Модель наблюдений lifecycle

Продуктовые данные не меняются.

- Provider observation: выбранные QuerySession и notification controller,
  последовательность setup/cleanup эффекта потребителя.
- Pending request: URL, connectionScope, AbortSignal, deferred Response.
  Ответ можно доставить после abort, чтобы проверить защиту от поздних результатов.
- Lease: контролируемый Promise функции release; функция считает освобождения.
- Scope: scopeA/scopeB из tests/chats/constants.ts; это фиктивные подключения.
- Resource state: кеш QueryClient, его подписки, owner context,
  signal.aborted и число таймеров. Проверяется после replay и final unmount.

Все ресурсы принадлежат одному тесту. Завершение теста размонтирует React,
продвигает deferred disposal в act и завершает ожидающие ответы.
Неполученный lease не считается принадлежащим клиенту; поздний lease немедленно
освобождается без сети. После закрытия запись в кеш и ACK запрещены.
