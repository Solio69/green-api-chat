# Research: ESLint и Prettier

**Дата**: 2026-10-01

## Фактическое окружение

Next.js 16.3.7, ESLint 9.39.5, Prettier 3.9.9, TypeScript 5.9.3.
eslint-plugin-import 2.32.0 уже установлен транзитивно через eslint-config-next.
Next.js регистрирует import и typescript-eslint plugins; пользовательский блок
дополняет их, сохраняя Next.js recommended configs.
Исходное покрытие: завершённый соседний тред сообщил 66 integration и 24 E2E Passed.

## Решения и варианты

| Решение | Выбор | Причина и альтернативы |
| --- | --- | --- |
| Линтер | Существующий Next.js + готовые правила | Сохраняет React/Next проверки; смена всего стека не нужна. |
| Форматтер | Prettier semi false | Один источник форматирования; не добавлять ESLint semi. |
| Импорты | eslint-plugin-import как прямая зависимость | Реальный импорт зависимости должен быть объявлен; новая версия не нужна. |
| Типы | consistent-type-imports с separate-type-imports | Типы явно отделены от runtime; типовые импорты остаются в группе источника. |
| Границы автоматизации | Без custom rules | Callback-параметры, логические имена и условия требуют смыслового ревью. |
| curly | Не включать конфликтующий режим | multi-line и multi-or-nest могут спорить с переносами Prettier; all противоречит согласованным коротким if. |
| Side effects | Сохранить порядок | Перестановка globals.scss и аналогичных импортов может изменить поведение. |
| Проверка конфигурации | ESLint API и Prettier на временных строках | Проверяется активность готовых правил, без собственного линтера и unit-раннера. |
| Новые script-команды | Только lint:fix | format уже есть; общий check относится к отдельной задаче. |

## Первичные источники

- [ESLint arrow-body-style](https://eslint.org/docs/latest/rules/arrow-body-style/):
  as-needed преобразует единственный return в expression body.
- [ESLint prefer-template](https://eslint.org/docs/latest/rules/prefer-template/):
  запрещает строковую конкатенацию, не числовую арифметику.
- [ESLint no-unneeded-ternary](https://eslint.org/docs/latest/rules/no-unneeded-ternary/):
  покрывает boolean-ветки; не обещает универсальную замену JSX-тернарников.
- [Порядок импортов](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md):
  groups, pathGroups, alphabetize и newlines-between. type отсутствует как отдельная
  группа; относительные imports объединены; side effects не автоисправляются.
- [types-only imports](https://typescript-eslint.io/rules/consistent-type-imports/):
  prefer type-imports, separate-type-imports; не менять imports, используемые в runtime.
- [Совместимость curly](https://github.com/prettier/eslint-config-prettier#curly):
  multi-line и multi-or-nest конфликтуют с форматтером при длинных выражениях.
- [Prettier semicolons](https://prettier.io/docs/options#semicolons):
  semi false сохраняет защитные символы в местах риска ASI.

Локальные исходники этих установленных пакетов сверены с документацией.
Поддерживаемые версии не обновляются в рамках настройки правил.
