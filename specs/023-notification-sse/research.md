# Исследование SSE и Query интеграции

**Дата**: 2026-10-02; runtime проверки NotRun.

| Вариант             | Преимущества                                | Риски / решение                                                                                                                                                                          |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native EventSource  | Framing/reconnect встроены                  | [Конструктор](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource) принимает URL/withCredentials, не custom owner+scope headers; query capability раскрывать нельзя |
| Fetch streaming SSE | Header proof, AbortSignal, existing cookies | Parser/reconnect нужно тестировать; выбран root и согласованный security contract                                                                                                        |
| WebSocket           | Двунаправленный канал                       | Дополнительный transport/lifecycle не требуется; HTTP ACK уже согласован                                                                                                                 |

[Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) поддерживает custom headers/ReadableStream/AbortSignal. [SSE framing](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) задаёт UTF8 и пустую строку между событиями; own fetch parser проверяется на chunk/codepoint/CRLF boundaries. Стандартный event id не даёт durable replay. [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting) допускает streaming, однако reverse proxy buffering должен быть отключён; один постоянный process — явное ограничение проекта.

Owner capability в памяти обоснован невозможностью отличить две вкладки по общей cookie. Он не заменяет cookie auth и scope, не является несекретным tabId. Disconnect делает форму недоступной до attached stream; backend повторно проверяет то же право. Heartbeat10/stall30/grace10/backoff являются параметрами приложения, не гарантией browser/provider.

Existing create-query-session.ts имеет retain/release для StrictMode и close → cancel/clear; новая controller cleanup интегрируется через один public resource cleanup API018, не через независимый глобальный observer. QueryProvider/page/ChatWorkspace slots сохраняются; визуальный редизайн не входит. Shared019 message-cache/overlay исключает разные массивы history/SSE/Send; scoped status merge024 не перезаписывает read. GetChats incoming invalidations объединяются с 1/сек pacing по [provider limits](https://green-api.com/telegram/docs/api/ratelimiter/) и не меняют 014 defaults.

Unknown chat сохраняется раньше async GetChats, ACK после merge/overlay, независимо от refinement. Это прямо согласованное пользовательское поведение. Transport errors не классифицируют всех ожидающих messages как failed. Проверки fake server/provider и existing Playwright позволяют проверить multi-tab, stale generation и historyrace без реальных аккаунтов или новых пакетов.

Нерешённых продуктовых вопросов нет; текущие settings/public proxy работоспособность не проверены. Нативный EventSource в раннем обсуждении был иллюстрацией SSE, фактическая реализация fetch streaming с headers.
