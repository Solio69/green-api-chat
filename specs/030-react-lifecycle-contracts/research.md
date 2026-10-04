# Research: React lifecycle

Дата: 2026-10-03. Проверены реальные провайдеры, фабрики query/notification,
src/app/page.tsx и tests/query/chat-query.spec.ts.

## Факты и варианты

| Решение | Выбор и причина | Альтернатива и ограничение |
| --- | --- | --- |
| Среда | Vitest DOM + RTL, development React; renderHook с reactStrictMode: true на корне | Production Playwright не повторяет эффекты |
| Граница подмены | fetch и acquireBrowserTabLease; настоящие провайдеры, сессия, контроллер, транспорт | Подмена контроллера проверяет собственную заглушку |
| Наблюдение | Эффект потребителя фиксирует setup/cleanup/setup; реальные сессии/владельцы доступны через контексты; spy фабрики сохраняет реализацию | Ручной retain/release не доказывает React lifecycle |
| Смена scope | Меняем key вместе со scope, как src/app/page.tsx | Изменение одного prop не является контрактом существующего провайдера |
| Время | fake timers и deferred Promise, продвижение в act | Реальное ожидание увеличивает нестабильность |
| Web Locks | Управляем результат существующей функции получения lease | Настоящее межвкладочное исключение остаётся в браузерном наборе |

Фабрики создают ленивые экземпляры при render. Заброшенный Strict Mode initializer
может оставить объект с isActive=true, но без сетевых запросов, владельца,
подписок QueryClient и кеша. Проверяется отсутствие удерживаемых ресурсов,
а не ошибочное требование вызова close у никогда не смонтированного объекта.
Реально выбранный сеанс должен закрыться после окончательного unmount.

Контроллер откладывает освобождение retain на setTimeout(0), отменяет запросы,
освобождает полученный позже lease. QuerySession защищает остальные cleanup
от исключения одного callback. Это существующие контракты; тесты регрессионные.

RTL wrapper сам является React-компонентом: StrictMode внутри него не является корнем. Проверено по установленному RTL dist/pure.js и фактическому replay; используется корневая опция reactStrictMode.

## Проверенные официальные источники

- [React StrictMode](https://react.dev/reference/react/StrictMode): дополнительные render/effect проверки development-only; корневой режим нужен для replay эффектов.
- [RTL API](https://testing-library.com/docs/react-testing-library/api/): renderHook, wrapper, rerender, unmount и act.
- Установленные версии и конфигурация зафиксированы в задаче 029; новые пакеты не нужны.
