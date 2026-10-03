# Области типов 031

| Проект | Исходники | Типы окружения |
| --- | --- | --- |
| tsconfig.json | src, Next config, Playwright configs и остальные tests | node, Next-generated; expect импортируется из Playwright |
| tsconfig.vitest.json | unit, component, setup, support, vitest.config.mts | node, vite/client, явные Vitest/RTL импорты |
| tests/fixtures/query-app/tsconfig.json | query app/components, tests/query, playwright.query.config.ts и общие импорты | node, Next-generated собственного приложения |

Generated types не являются исходными продуктами; могут быть подготовлены
typegen без production build. Строгость наследуется от root.
Известные папки тестов включают новые TS/TSX файлы автоматически.
JS-конфиги не переводятся на checkJs в этой задаче.
