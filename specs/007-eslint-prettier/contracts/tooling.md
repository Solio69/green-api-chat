# Contract: проверка TypeScript/JavaScript

## Область

ESLint: src, tests/**/*.ts, корневые _.ts/_.mjs-конфигурации.
Существующие исключения .next, build, dependencies, документы и Spec Kit сохраняются.
Prettier: существующая область .prettierignore, без расширения на чужие документы.

## Активные настройки

| Источник        | Правило/настройка                                             | Результат                                           |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Next.js presets | core-web-vitals, typescript                                   | Существующие framework-проверки                     |
| JS/TS ESLint    | arrow-body-style: as-needed                                   | Одно возвращаемое выражение без блока               |
| JS/TS ESLint    | prefer-template                                               | Шаблон вместо строкового +                          |
| JS/TS ESLint    | no-unneeded-ternary                                           | Без лишнего boolean-тернарника                      |
| import plugin   | first, no-duplicates                                          | Импорты перед кодом, без дубликатов                 |
| import plugin   | order                                                         | Node → packages → @/ → относительные → SCSS Modules |
| import plugin   | newline-after-import                                          | Ровно одна пустая строка после импортов             |
| TS ESLint       | no-explicit-any, no-unused-vars: error                        | Ошибка при any/неиспользуемом значении              |
| TS ESLint       | consistent-type-imports                                       | Явный import type, separate-type-imports            |
| Prettier        | semi false                                                    | Без конечных ;, кроме защиты ASI                    |
| Prettier        | tabWidth 2, singleQuote true, trailingComma all, endOfLine lf | Единый формат                                       |

Type imports не выделяются в отдельную группу. Значения @/ задаются явным pathGroup.
SCSS Modules с styles-binding идут последними. Side-effect imports не сортируются:
их порядок и директивы сохраняются. Не добавлять sort-imports одновременно с import/order.
curly остаётся выключенным eslint-config-prettier; короткие if требуют ревью.
arrow-body-style не меняет обычную function и не превращает вызов с побочным
эффектом в неявный return, если возвращаемое значение может изменить контракт.

## Команды и коды

| Скрипт                      | Режим                                                      |
| --------------------------- | ---------------------------------------------------------- |
| lint                        | eslint . --max-warnings=0; проверка                        |
| lint:fix                    | eslint . --fix --max-warnings=0; изменяет допустимые места |
| format:check                | prettier --check .; проверка                               |
| format                      | prettier --write .; изменяет формат                        |
| typecheck                   | next typegen && tsc --noEmit                               |
| test:integration / test:e2e | Существующая регрессия                                     |

Проверки завершаются кодом 0 только при успехе. Код 1/2 или ошибка окружения
не являются подтверждением корректности. Игнорируемые файлы намеренно
не участвуют в проверке; не заявлять, что они прошли линтер.
