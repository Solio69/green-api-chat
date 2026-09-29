# Research: E02.2 — локальная основа Next.js

**Дата проверки**: 2026-09-29.
**Статус**: техническое исследование выполнено; установка, инструменты и сборка
проверены. Спецификация и реализация согласованы пользователем.

## Clarify

| Категория | Статус | Основание |
| --- | --- | --- |
| Границы и результат | Clear | Локальная основа, /, /api/health, проверки, README |
| Сценарии и UX | Clear | Нейтральная стартовая страница; интерфейс чата вне задачи |
| Ошибки и повторы | Clear | Ошибки окружения документируются; GET без побочных эффектов |
| Приватность и зависимости | Clear | Реквизиты, сообщения и API провайдера не используются |
| Данные и состояния | NotApplicable | Нет прикладного хранилища и сессии |
| Критерии завершения | Clear | SC-001–SC-005; dev и production проверяются отдельно |
| Терминология и ограничения | Clear | Health означает доступность обработчика; Git и установки по правилам |

Новых вопросов: 0; NeedsDecision: 0. Согласование спецификации не считается
разрешением реализации. Уточнений согласованного поведения не требуется.

## R1. Создание основы в существующей папке

| Вариант | Плюсы | Ограничения | Решение |
| --- | --- | --- | --- |
| Добавить минимальные файлы вручную | Явный состав, сохранность правил и документов | Требует внимательной настройки конфигураций | Выбран |
| Генератор create-next-app в отдельной папке с переносом | Готовые настройки от разработчиков Next.js | Дополнительная папка и перенос; установка и генератор выполняются пользователем | Допустим, но лишние действия для этой задачи |

Next.js документирует ручное создание приложения. Генератор может создавать
AGENTS.md и подключать Tailwind; наш проект уже содержит правила и использует
SCSS. Источник: [установка Next.js](https://nextjs.org/docs/app/getting-started/installation).
Генератор, npm init и Git-команды с изменениями агентом не запускаются.
next.config.ts задаёт agentRules: false, чтобы next dev не дописывал агентские
инструкции в проектные файлы. Настройка подтверждена установленными
node_modules/next/dist/server/config-shared.d.ts и
node_modules/next/dist/server/lib/generate-agent-files.js;
после повторного запуска хеш AGENTS.md сохраняется.

## R2. Среда и версии

В локальной оболочке фактически получены Node 24.14.1 и npm 11.11.0.
Для проекта выбираются Node 24.x и npm 11.x; packageManager — npm@11.11.0.
Node 24 поддерживается целевой площадкой; Vercel самостоятельно выбирает
минорную и patch-версию этой ветки. Источник:
[версии Node на Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Прямые зависимости фиксируются точными версиями без ^ и ~:

| Пакет | Версия | Группа |
| --- | --- | --- |
| next | 16.3.7 | dependencies |
| react | 19.3.0 | dependencies |
| react-dom | 19.3.0 | dependencies |
| typescript | 5.9.3 | devDependencies |
| @types/node | 24.19.0 | devDependencies |
| @types/react | 19.3.0 | devDependencies |
| @types/react-dom | 19.3.0 | devDependencies |
| eslint | 9.39.5 | devDependencies |
| eslint-config-next | 16.3.7 | devDependencies |
| eslint-config-prettier | 10.1.8 | devDependencies |
| prettier | 3.9.9 | devDependencies |
| sass | 1.105.0 | devDependencies |

Версии и peerDependencies прочитаны из официального npm registry через
JSON HTTP GET; архивы не скачивались и пакеты не устанавливались.
Источники метаданных: [Next](https://registry.npmjs.org/next/16.3.7),
[React](https://registry.npmjs.org/react/19.3.0),
[React DOM](https://registry.npmjs.org/react-dom/19.3.0),
[TypeScript](https://registry.npmjs.org/typescript/5.9.3),
[ESLint](https://registry.npmjs.org/eslint/9.39.5),
[eslint-config-next](https://registry.npmjs.org/eslint-config-next/16.3.7),
[eslint-config-prettier](https://registry.npmjs.org/eslint-config-prettier/10.1.8),
[Prettier](https://registry.npmjs.org/prettier/3.9.9),
[Sass](https://registry.npmjs.org/sass/1.105.0),
[Node types](https://registry.npmjs.org/@types%2fnode/24.19.0),
[React types](https://registry.npmjs.org/@types%2freact/19.3.0),
[React DOM types](https://registry.npmjs.org/@types%2freact-dom/19.3.0).

Почему не все latest:
- typescript-eslint 8.71.0 допускает TypeScript >=4.8.4 <6.1.0.
  Проверенный latest TypeScript 7.0.2 вне этого диапазона. Выбрана совместимая
  ветка 5.9; миграция на новую основную версию для основы не нужна.
- eslint-config-next допускает ESLint >=9, но его зависимости
  eslint-plugin-react 7.37.5, eslint-plugin-import 2.32.0 и
  eslint-plugin-jsx-a11y 6.10.2 ограничивают peer-диапазон ESLint веткой 9.
  Проверенный latest ESLint 10.11.0 не соответствует всему комплекту.
- Типы Node выбираются для версии среды 24, а не по latest для Node 26.

Основания: [поддержка typescript-eslint](https://typescript-eslint.io/users/dependency-versions/),
[React plugin](https://registry.npmjs.org/eslint-plugin-react/7.37.5),
[import plugin](https://registry.npmjs.org/eslint-plugin-import/2.32.0),
[a11y plugin](https://registry.npmjs.org/eslint-plugin-jsx-a11y/6.10.2).

Дерево зависимостей подтверждено npm ci пользователя и npm ls --depth=0;
проверки типов, линтера, форматирования и сборки проходят.
--force и --legacy-peer-deps не используются.

Ограничение: ESLint 9 находится в EOL с 2026-08-06 и больше не получает
обновлений от команды ESLint. Это технический долг выбранного совместимого набора,
а не ошибка установки. Источник: [поддержка ESLint](https://eslint.org/version-support/).
Установленные React/import/a11y-плагины не заявляют поддержку ESLint 10.
Обновление следует выполнять согласованным набором после проверки их совместимости;
принудительный обход peerDependencies не применяется.

## R3. Сервер и границы модулей

App Router: интерфейс в src/app/page.tsx, HTTP API в src/app/api/health/route.ts.
Route Handler получает запрос непосредственно; дополнительный Express-сервер
не нужен. Next.js предоставляет серверную часть в этом же процессе.
Ссылка: [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

Стартовая страница — Server Component без состояния и use client.
Отдельный сервисный слой для постоянного ответа не создаётся. Когда появится
интеграция, серверные модули и границы импорта проектируются в её задаче.

Health обрабатывается при запросе: await connection() из next/server
исключает предварительное формирование этого ответа; Cache-Control: no-store
запрещает его хранение HTTP-кешами. Не включаются use cache и статический экспорт.
Источник: [connection](https://nextjs.org/docs/app/api-reference/functions/connection).
Это проверка способности обработчика ответить, без проверки внешних зависимостей.

## R4. Стили

Согласованы SCSS Modules, БЭМ и &: блок foundation, элементы
foundation__title и foundation__description. Модификатор добавляется только
при наличии реального состояния; вложенность DOM-селекторов ради структуры не нужна.
Глобальная база — box-sizing, отступы, фон, цвет и системный шрифт.
По указанию пользователя цвета и общие значения вынесены в SCSS-константы,
повторяющиеся группы свойств — в миксины. Вариант CSS custom properties полезен
для смены темы во время работы приложения, но такой сценарий сейчас не согласован.
Для текущих постоянных значений выбран модуль tokens; typography переиспользует
font-size и line-height заголовка и описания с необязательным font-weight.
Модули подключаются через [@use](https://sass-lang.com/documentation/at-rules/use/),
группы свойств — через [@mixin/@include](https://sass-lang.com/documentation/at-rules/mixin/).
Правило закреплено в AGENTS.md для всех последующих стилей проекта.
Внешние шрифты и картинки не нужны для этой страницы.

Sass устанавливается как devDependency; Next.js поддерживает .module.scss.
Источник: [Sass в Next.js](https://nextjs.org/docs/app/guides/sass).
Библиотека UI и отдельный Stylelint в минимальную основу не включаются:
SCSS компилируется сборкой, форматируется Prettier и проверяется ревью.

## R5. Проверки и форматирование

ESLint flat config: пресеты Next core-web-vitals и typescript,
затем eslint-config-prettier/flat. Форматирование выполняет отдельный Prettier.
Вариант с Biome потребовал бы отдельно подтвердить покрытие SCSS и правил Next;
для согласованного набора выбираются ESLint + Prettier.
Источник: [настройка ESLint](https://nextjs.org/docs/app/api-reference/config/eslint).

typecheck сначала запускает next typegen, затем tsc --noEmit:
генерируемые маршрутные типы доступны и в свежей рабочей копии.
next-env.d.ts и .next исключаются из Git; генерация этих служебных файлов
не означает исправление исходников. Источник:
[next CLI](https://nextjs.org/docs/app/api-reference/cli/next).

В локальной настройке Git обнаружен core.autocrlf=true. Для воспроизводимого
форматирования в .gitattributes фиксируется LF только для новых файлов приложения.
Настройка пользователя и существующие документы не меняются.
next.config.ts включается в TypeScript include для проверки типизированной конфигурации.

Область форматирования охватывает приложение, новые конфигурации и README;
существующие материалы Spec Kit и обзор не переформатируются.
prettier --check сообщает нарушение через ненулевой exit code:
[CLI Prettier](https://prettier.io/docs/cli).

## R6. Установка, воспроизводимость и проверка результата

Первая установка — npm install пользователем; повторная по готовому lock-файлу —
npm ci. Последняя требует совпадения package.json и package-lock.json,
пересоздаёт node_modules и не переписывает lock-файл.
Источник: [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

Готовая основа не имеет постоянного набора unit-тестов. При извлечении общих
констант контракт проверяется до правки и после неё; искусственный Red не нужен.
Новая и изменяемая бизнес-логика и серверные контракты требуют TDD по действующим
правилам проекта. Проверяются реальные HTTP-ответы dev/production-сервера, вид страницы,
сборка и команды качества. Отрицательные проверки инструментов выполняются
временными локальными примерами с восстановлением исходного состояния,
без добавления файлов тестов в репозиторий.

PowerShell-тесты Spec Kit подтверждены: 12 Passed, 0 Failed, 0 Blocked.
При неизменном комплекте повторный прогон не требуется. Проверяется сохранность
исполняемых файлов и политики; правила TDD согласованы отдельно.
UI проверяется в доступном браузере без установки инструментов.
Если браузерная проверка недоступна агенту, она передаётся пользователю
и остаётся NotRun/Blocked до фактического результата.
