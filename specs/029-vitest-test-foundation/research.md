# Исследование 029

Дата: 2026-10-03. Задача — работающие Node/React-тесты на Vitest в существующем проекте. Реализация и локальный commit прямо разрешены пользователем этому чату после полного комплекта и ревью.

## Факты и совместимость

Node 24.14.1, npm 11.11.0, React 19.3.0; Vitest/RTL/jsdom пока отсутствуют. Метаданные npm registry проверены без скачивания пакетов.

| Dev dependency              | Версия | Назначение                                      |
| --------------------------- | ------ | ----------------------------------------------- |
| vitest                      | 5.0.3  | Runner и API assertions/mocks                   |
| vite                        | 8.3.2  | Peer dependency Vitest и преобразование модулей |
| @vitejs/plugin-react        | 6.1.1  | JSX и development React                         |
| @testing-library/react      | 16.3.3 | Рендер и доступные DOM-запросы                  |
| @testing-library/dom        | 10.4.2 | Обязательный peer RTL                           |
| @testing-library/user-event | 14.6.7 | Пользовательское нажатие в пилоте               |
| @testing-library/jest-dom   | 7.0.1  | Читаемые DOM-assertions Vitest                  |
| jsdom                       | 29.1.1 | DOM, совместимый с Node 24.14.1                 |

Последний jsdom 30.1.1 требует Node ^24.15.0 в ветке 24; выбран 29.1.1 с Node >=24.0.0. React 19 поддерживается peer RTL. Vite 8 соответствует Vitest 5 и plugin-react 6. Sass уже установлен. Дополнительные optional peer plugin-react не нужны для этого использования.

## Варианты

- Два проекта одного Vitest вместо одного глобального jsdom: Node-тесты не получают document/window, наборы выбираются отдельно. Два самостоятельных runner-конфига дали бы лишнее повторение.
- jsdom вместо happy-dom: распространённое DOM-окружение RTL; цена — devDependencies и ограниченная имитация браузера. Геометрия, фокус при resize и реальные HTTP остаются в Playwright.
- Явный @/ alias через fileURLToPath(new URL('./src', import.meta.url)) вместо ещё одного плагина путей: в проекте единственный alias; независимый пакет не требуется.
- Явные импорты test/expect, globals=false, явный afterEach(cleanup): глобальные Vitest API не смешиваются с Playwright.
- Два recipient-label сценария переносятся с исходными ожиданиями. RecipientSearchResult проверяет найденного получателя и действие «Написать» на DOM-уровне; полный browser сценарий сохраняется из-за навигации, запросов и геометрии.
- Для QueryClient используется фабрика нового клиента на тест с onTestFinished(clear); не общий singleton. Retry выключен, gcTime=Infinity предотвращает фоновые GC-таймеры теста. Контракт очистки подтверждается инфраструктурными тестами.
- CSS Modules обрабатываются Vite (css=true, существующий Sass). Assertions не зависят от generated class names или CSS-геометрии.

## Источники

- [Vitest projects](https://vitest.dev/guide/projects): projects, независимый include/environment и --project.
- [Next.js + Vitest](https://nextjs.org/docs/app/guides/testing/vitest): React plugin и DOM-проверки; async Server Components остаются в Next.js/E2E.
- [RTL setup](https://testing-library.com/docs/react-testing-library/setup/): явная cleanup при отключённых globals.
- [Vitest environments](https://vitest.dev/guide/environment): Node и jsdom, ограничения DOM.
- npm registry: точные опубликованные версии, engines и peerDependencies перечисленных пакетов.

Проверено 2026-10-03. Совместимость по метаданным не заменяет фактическую установку и прогоны. Новая бизнес-логика, CI и устранение DEFECT-01 baseline не входят в 029.
