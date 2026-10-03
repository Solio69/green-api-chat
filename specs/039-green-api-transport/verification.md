# Проверка 039: общий транспорт GREEN-API

Дата: 2026-10-03. Локальная реализация и регрессия завершены; GitHub CI фиксируется после commit/push.

| Проверка | Результат |
| --- | --- |
| Spec Kit и анализ до кода | Passed: 880 путей, SHA-256 до/после `328ecf3073ba2cd219bf9e9d4e372badad8d4e55f3e2b4e7a4ab473564d8439f`, unchanged; findings 0 |
| Provider integration baseline | Passed: 179/179 на старых адаптерах до изменений |
| Новый transport Red | Passed: 5/5 поведенческих assertions упали на минимальном stub без import/environment ошибок |
| Новый transport Green | Passed: 5/5 |
| Целевые adapter regression | Passed: 115/115 reads и 64/64 send/notification после переноса |
| Notification regression после review | Passed: 5/5; добавлены 2 независимых теста для Retry-After, Delete false и malformed JSON |
| Полный Vitest | Passed: 31/31, 8 файлов |
| Полный integration | Passed: 361/361 после добавления notification tests |
| Browser Query | Passed: 45/45 |
| Production E2E | Passed: 110/110 с production build |
| Typecheck app/tests/query | Passed; tests typecheck повторён после новых notification tests |
| ESLint, Stylelint, Prettier | Passed; file-specific ESLint новых tests повторён |
| Граф Client Components → server auth/session/http/transport | Passed: 28 roots, 226 source TS/TSX, запрещённых runtime-путей 0; type-only edges исключены |
| Повторный read-only анализ | Passed: 883 пути, SHA-256 до/после `73d244e30689682cf21d143794222e9a08141e899746286bac1280139f45c4dd`, unchanged; findings 0 |
| `git diff --check` | Passed |
| GitHub Actions quality/browser | NotRun до commit/push |

Общий transport делает один fetch и возвращает сырой Response. URL с токеном не логируется. GetState/Account, Chats/History, CheckAccount, SendMessage и notificationRequest сохраняют собственные retry, deadline, cancellation и классификацию ошибок. Notification deadline равен исходным 8 секундам; все остальные операции — исходным 10 секундам. После dispatch SendMessage не повторяется и не связывается с caller abort. В тестах применяются только фиктивные credentials.
