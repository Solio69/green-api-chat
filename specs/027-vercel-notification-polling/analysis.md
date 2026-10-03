# Analysis: Vercel notification polling

2026-10-03. Итоговый статус: Passed / Completed / PassedSynthetic.
Согласование и авторизация spec/code/review получены из переписки; повторного gate нет.

## Область и метод

Проверены полный комплект027 (spec/plan/tasks/research/model/HTTP/client/quickstart/
readiness/acceptance/verification), актуальные общие документы, AGENTS/GIT_POLICY,
CODING_RULES/CODE_STYLE и C1–C8, product diff и fake providers/tests.
В read-only проходе прочитаны 60 существующих изменённых файлов:
34 исходника/теста и 26 документа. Проверены локальные ссылки,
разрешимость импортов, отсутствие импортов удалённого runtime, карта требований,
завершение задач, бюджеты маршрутов и staged README. Реальные реквизиты не выводились.

Полный inventory включает 696 файлов проекта. Исключены .git, node_modules,
.next, playwright-report, test-results, coverage, out, build и tsconfig.tsbuildinfo.
Список путей и SHA-256 каждого файла совпали до и после прохода.
Общий SHA-256 до/после: 4BF24E3D477CC52275787F952596590C5B877868092DD178E37F948DFF002772.
Проход не писал файлы проекта; этот отчёт сохранён отдельным действием после завершения.

До реализации отдельный read-only проход включал705 файлов:
SHA-256 до/после 4DF7D0528AFE76461AF3D97462332112FECC817C96427F2AA5B591928C114A04.
Количество итогового inventory учитывает согласованное удаление registry/SSE и новые файлы027.

## Findings

| Severity | Unresolved |
| --- | --- |
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |

Локальные ссылки: разрешены. Импорты: разрешены, удалённый runtime не импортируется.
Process registry и server-wide send lease отсутствуют в действующем runtime.
Настройки/receive/ACK имеют maxDuration20; общий серверный deadline8/16 секунд.
Последовательность receive → apply/skip → ACK → delete проверена тестами.
Потеря delete-ответа, поддельный/чужой/истёкший proof и повреждённые события
покрыты. Browser scope исключительности и отсутствие глобальной координации
описаны явно. Устаревшие assumptions022/023 перекрывает контракт027; прошлые
verification не переписаны как доказательство текущего прогона.

## Метрики и полное покрытие

10 FR,5 SC,2 US,6 задач; выполнено6/6. Coverage15/15=100% — карта требований,
не процент покрытия строк. Неохваченных требований0, повторяющихся T-ID0,
непривязанных задач0; существенных неоднозначностей0. Readiness8/8.
Dependencies: T001 behavioral Red → T002/T003 → T004 Green → T005 Refactor → T006 final.
T005/T006 также имеют процессное основание C3/C4/C7/C8 и SC004/005.

| Requirement | Tasks |
| --- | --- |
| FR-001 | T001,T002,T004,T006 |
| FR-002 | T002,T003,T004 |
| FR-003 | T001,T002,T004 |
| FR-004 | T002,T003,T004 |
| FR-005 | T003,T004,T005 |
| FR-006 | T003,T004 |
| FR-007 | T002,T003,T004 |
| FR-008 | T003,T004 |
| FR-009 | T002,T006 |
| FR-010 | T001,T004,T005,T006 |
| SC-001 | T001,T002,T004 |
| SC-002 | T003,T004 |
| SC-003 | T003,T004 |
| SC-004 | T004,T005,T006 |
| SC-005 | T005,T006 |

## C1–C8

| Principle | Result | Основание |
| --- | --- | --- |
| C1 | PASS | Схема и варианты обсуждены, Vercel фиксирован; ограничения явно описаны |
| C2 | PASS | Одна разрешённая миграция027; UI/пагинация/дополнительная инфраструктура не расширены |
| C3 | PASS | Пользователь прямо разрешил спеки, код и самостоятельное review/refactor без повторных согласований |
| C4 | PASS | Git использован только read-only; staged README сохранён, коммит/staging/push не выполнялись |
| C5 | PASS | Зависимости не устанавливались, БД/Redis/настройки/публикация не изменялись |
| C6 | PASS | Feature выбран явно; в тестах только фиктивные данные; cookie и секрет остаются серверными |
| C7 | PASS | Behavioral Red до кода; Green/regression/quality/preview фактически выполнены; read-only хеши совпали |
| C8 | PASS | Бounded handlers, HMAC и Web Locks без новых пакетов; роли выделены, правила повторно прочитаны |

Индекс содержит только пользовательский README.md, blob bed4bb7636a0e3114ab99e42792aa21ab4a8aa08.
Рабочая копия README обновлена по архитектуре и деплою; пользовательская структура сохранена.

## Доказательства и границы

Behavioral Red:1 expected failed (receive409 вместо200). Green:119 passed.
Итог:353 integration,45 React/Query,109 production E2E; production build,
lint/styles/format/typecheck Passed. Ревью и рефакторинг завершены; desktop/mobile
превью просмотрено. Команды, промежуточные ошибки и исправления:
[verification.md](verification.md). Макет сохранён.

Настоящие Telegram/очередь/настройки GREEN-API/Vercel deploy smoke: NotRun.
Публикация и расходы — операторский шаг, [quickstart.md](quickstart.md).
Web Locks не координирует разные devices/profiles/origins/cookie scopes.
Доставка at-least-once, автоматической повторной отправки нет; durable journal,
полное восстановление и exactly-once не заявлены. В реализации обязательной
оставшейся работы нет.

Название коммита: fix: make notification delivery compatible with Vercel.
