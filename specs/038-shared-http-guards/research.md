# Research 038: матрица существующих HTTP-контрактов

Дата: 2026-10-03. Основание: текущие handlers, `tests/integration/{send-message,history-api,chats-api,recipient-search,vercel-notifications,login-route}.spec.ts`, локальная архитектурная карта. Никакие ответы или лимиты не меняются.

| Маршрут/handler | Порядок обязательных проверок до провайдера | Origin/Host | Content-Type/JSON/лимит | Scope | Ответ отказа |
| --- | --- | --- | --- | --- | --- |
| `POST /api/messages` send | Origin → конфигурация → сессия → scope → тело → DTO | Обязательный same-origin; Host берётся из фактического заголовка при наличии; malformed Host без fallback | JSON media type, stream ≤65 536 фактических байт; Content-Length игнорируется; invalid 400, size 413 | pattern, затем совпадение; 400/409 | JSON no-store; `outcome=not_sent` до dispatch, `unknown` только после неоднозначного dispatch |
| `POST /api/chats/history` | конфигурация → сессия → scope → Origin → `request.json()` → DTO | Тот же строгий Origin/Host, но проверяется после scope | Content-Type не обязателен, отдельного byte-limit нет; invalid JSON 400 | 400/409 | JSON no-store; 503/401/403/400 по причине |
| `GET /api/chats` | конфигурация → сессия → scope → provider | Нет Origin-проверки | Нет JSON body | 400/409 | JSON no-store |
| `POST /api/recipients/search` | конфигурация → сессия → media type → `request.json()` → DTO | Нет Origin-проверки | JSON media type; отдельного byte-limit нет; invalid JSON/DTO 400 | Нет scope-заголовка | JSON no-store; нет новой CSRF-политики |
| `POST /api/notifications/{settings,receive,ack}` | method → Origin → конфигурация/секрет → сессия → scope → body → action DTO | Тот же строгий Origin/Host | JSON media type; Content-Length обязан быть десятичным ≤8 192 при наличии; stream ≤8 192 фактических байт; invalid/size 400 | 400/409 | JSON no-store; ACK секрет остаётся серверным |
| `POST /api/auth/login` | JSON media type → raw text → resolveLogin/DTO | Нет Origin-проверки | JSON media type; размер 8 192 проверяется существующим `resolveLogin` после чтения raw text | Нет | JSON no-store; контракт логина и сохранение cookie остаются |

Матрица фиксирует текущий код, а не предлагает новые правила. Для других auth routes (`logout`, `end-session`) нет общего JSON request validation; они остаются вне переноса 038. `Content-Length` не считается доказательством фактического размера. Тесты исходных handlers уже проверяют invalid Origin/Host, scope, неверный media type, UTF-8, поток/лимиты, отказ до провайдера и разные `outcome`.

## Варианты

| Вариант | Преимущества | Ограничения/риск | Выбор |
| --- | --- | --- | --- |
| Низкоуровневые функции Origin, scope, JSON reader и no-store response; старые handlers сохраняют порядок и mapping | Устраняет точные повторы без единого навязанного pipeline | Требует явных параметров byte-limit и Content-Length policy | Выбран |
| Универсальный middleware/guard chain для всех маршрутов | Единая структура | Может переставить проверки и изменить статусы/провайдера; больше абстракции | Отклонён |
| Только общие константы без извлечения проверок | Минимальный diff | Повторение и расхождения остаются | Отклонён |

`isSameOrigin` общая для send/history/notifications с прежней строгой семантикой. `readConnectionScope` проверяет только pattern и отдаёт значение/null; сравнение и ответ остаются у handler. `readBoundedJsonBody` считает прочитанные байты и возвращает `ok | invalid_media_type | invalid_body | too_large`; параметр позволяет notification прежний precheck Content-Length, send — игнорирование этого заголовка. `readJsonBody` без лимита для history/recipient; media type проверяется отдельно только там, где уже требовался. `jsonNoStore` формирует только `Response.json` и `Cache-Control`; форму body/статус выбирает маршрут. Новых зависимостей нет.

Техническая коррекция по итогам Red/Green: общие Origin/Host константы размещены в src/server/http/constants.ts. Локальные дубликаты HISTORY_ORIGIN_CONFIG и поля SEND_CONFIG.ROOT_PATH/INVALID_HOST_PARTS удалены, поскольку после переноса не имеют потребителей. Это не меняет значения и контракт проверок.
