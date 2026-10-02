# Verification: история выбранного чата в консоль

**Дата**: 2026-10-02.
**Feature**: [spec.md](spec.md).
**Авторизация**: пользователь отдельно разрешила параллельно кодить получение истории 2026-10-02.
**Статус**: Автоматические проверки Passed; готово к ревью пользователя. Формат28 документов, ссылки, FR/SC и предкоммитное ревью Passed. Полный [analysis.md](analysis.md) сохраняется отдельно после read-only прохода при замороженных writers.

## Red до реализации поведения

| Проверка                               | Команда                                                               | Фактический результат                       | Причина                                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Handler/provider/fetch/merge/lifecycle | npm run test:integration -- history-api.spec.ts history-query.spec.ts | 22 Failed, 1 Passed, exit 1                 | Valid request и normalization возвращают null; handler вместо успеха/Origin403 возвращает 503; provider не вызывает fetch; loader/merge возвращают []; session не имеет scope/cleanup API |
| React hook/controller                  | npm run test:query -- history-query.spec.ts                           | 5 Failed, exit 1; fixture Next build Passed | Открытие и повтор не вызывают HTTP: expected 1/received 0; console completion также отсутствует                                                                                           |

No-op заглушки обеспечили работающие импорты, fixture и кнопки. Падения
указывают на отсутствующее поведение, а не на неработающее окружение.
Первый sandbox запуск встретил EPERM записи test-results, следующий —
дублирующий title для null/строки null; оба устранены до подтверждённого Red
и не считаются доказательством TDD.

Actual route E2E написан после Red handler и является проверкой
wiring/регрессии; отдельный искусственный Red откатом поведения не создавался.

## Реализация и границы

- POST /api/chats/history использует cookie/scope и parsed same-origin Origin до body/provider; серверный count всегда 10.
- Provider adapter ограничивает повтор 429 одной дополнительной попыткой в общем deadline; text/media нормализуются без raw metadata и загрузки вложений.
- Request key scope/chatId/accessId хранит только свежий snapshot; messages key сохраняет накопленные данные без дублей по idMessage.
- История запрашивается при каждом новом accessId; закрытие/старый выбор/закрытая сессия подавляют поздние результаты.
- ChatHistoryController в conversation slot главной возвращает null и выводит текущий snapshot/нормализованную ошибку с chatId/count. Два контроллера и StrictMode не умножают лог.
- История UI, пагинация, отправка, SSE, очередь, новые пакеты, постоянное хранение и Git mutations не реализуются.

## Автоматические проверки

Первый общий Green после реализации: integration 193 Passed / 1 Failed.
Единственное падение вызвано fixture двух сообщений с одинаковым временем
при ожидании input order; контракт сортирует одинаковое время по idMessage.
Fixture исправлена на media timestamp 200. Typecheck выявил две ошибки
сужения типа, устранённые явными DTO/data guards без casts. Повторный общий
integration: **194 Passed**, typecheck: **Passed**.

Первый полный Query Green: 15 Passed / 3 Failed. Падения относятся к тестовому
state helper: innerText нормализовал пробелы внутри JSON. Helper читает
textContent с EMPTY_STRING fallback, исходные данные/console не менялись.
Повторный полный Query: **18 Passed**, включая **5 проверок истории**.
Ручные same-JSON повторы выполняются при фиксированном Date.now, чтобы
одинаковый timestamp completion не скрывал новое чтение.

Первый полный production E2E: 82 Passed / 6 Failed. История получала 403 при
корректном Origin: Next.js нормализовал loopback Request.url в localhost,
тогда как Host/Origin браузера оставались 127.0.0.1. Это ошибка реализации,
не fixture. До исправления добавлены четыре target-Origin regression теста:
`npm run test:integration -- history-api.spec.ts --grep 'history target Origin'`
подтвердил **4 Failed** (actual Host, чужой localhost, malformed Host и source
path/query). Минимальный fix использует фактический Host с protocol Request.url,
strict HTTP(S) source и запрет неверного Host без fallback; X-Forwarded-* не
читаются. Повтор той же команды: **4 Passed**.

После исправления Origin полный integration подтвердил **198 Passed** (22,9 с),
включая **27 проверок истории**; полный production E2E — **88 Passed** (57,7 с),
включая **7 проверок истории**. Production build, итоговые typecheck, lint и
format:check Passed. Последний полный Query дал **18 Passed**; hook/controller
после него не изменялись. Stylelint Passed ранее, последующих изменений SCSS нет.

| Проверка                                          | Статус                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| Targeted ESLint auto-fix/import order owned paths | Выполнен; type-only unused destructure исправлен  |
| Targeted Prettier own sources/tests               | Passed                                            |
| npm run test:integration                          | Passed: 198 тестов, включая 27 проверок истории   |
| npm run test:query                                | Passed: 18 тестов, включая 5 проверок истории     |
| npm run test:e2e                                  | Passed: 88 тестов, включая 7 проверок истории     |
| npm run typecheck                                 | Passed                                            |
| npm run lint / npm run lint:styles                | Passed                                            |
| npm run format:check                              | Passed                                            |
| Production Next.js build                          | Passed; штатная сборка E2E                        |
| Документы Prettier / links / diff review          | Passed:28 документов, broken links0, diff --check |
| Полный read-only analyze при замороженных writers | Отдельный полный отчёт [analysis.md](analysis.md) |
| Ручное ревью пользователя и реальный инстанс      | NotRunExternal                                    |

Настоящие сообщения, реквизиты и raw provider body не сохранены в этом отчёте.
Fixture и tests используют только фиктивные значения.

## Дальнейший шаг

После приёмки 018 отдельная задача 019 подключает отображение общей истории.
Название коммита: `feat: load fresh chat history with scoped query cache`.
Коммит не создан.
