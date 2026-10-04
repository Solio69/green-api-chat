# Исследование 031

Дата: 2026-10-03. Исходные root/Vitest typecheck Passed в 030.
Query tsconfig существует, но общая команда его не вызывает.
Исходные include root также не гарантируют включение нового общего test helper.

| Вариант | Польза | Ограничение | Решение |
| --- | --- | --- | --- |
| Одна огромная TS-программа | Одна команда tsc | Смешивает route types двух Next-приложений и matcher types | Не выбран |
| Три существующих проекта + npm orchestration | Явные области, сохранение alias query-стенда, нет новых инструментов | Часть импортов повторно проверяется | Выбран |
| Project references/composite | Инкрементальная масштабируемость | Сложнее для трёх noEmit-проектов; здесь не требуется | Не выбран |

Root охватывает приложение, Playwright config и tests, кроме областей
Vitest/query. Vitest включает свои tests/setup/support/config; query включает
свой app/components, tests/query и playwright.query.config.
Импортируемые общие файлы проверяются TypeScript независимо от include.
types: node ограничивает автоматически подключаемые ambient types; Vitest
дополнительно использует vite/client. API expect импортируется явно.
Root проверяется с --incremental false, остальные уже неинкрементальны:
успех общей команды не опирается на старый tsbuildinfo.

[Next CLI](https://nextjs.org/docs/app/api-reference/cli/next) и установленный
next typegen --help подтверждают аргумент каталога без запуска build.
[TypeScript include](https://www.typescriptlang.org/tsconfig/include.html)
описывает автоматическое включение новых файлов по glob.
[TypeScript types](https://www.typescriptlang.org/tsconfig/types.html)
описывает ограничение автоматически видимых ambient packages.
