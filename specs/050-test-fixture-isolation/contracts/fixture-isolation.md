# Fixture isolation contract

E2E setup/teardown: отдельный Playwright API-контекст с обязательным `dispose()`, `POST /api/auth/login` с фиктивными `idInstance` и `apiTokenInstance`; только test fake перехватывает `getStateInstance` sentinel, увеличивает generation, очищает все карты/receipt и отвечает `authorized`. Код продукта не различает sentinel и не получает reset endpoint. Неверный HTTP/result прерывает тест. `workers: 1` и `fullyParallel: false` обязательны для общего fake.

Query setup/teardown: `POST /api/notification-fixture` с `{ "reset": true }`; endpoint заменяет mutable state и обновляет generation. Начавшаяся до сброса асинхронная операция не дописывает записи в новое состояние. Test fixture применяет очистку в `finally`.

Oracle: ожидаемые HTTP статус/строки статуса/нормализации задаются в `tests/protocol.constants.ts` или отдельных тестовых literals; fake provider и проверки не берут значения из production constants/functions. Временный неверный oracle обязан дать падение, затем откатывается.

Pending UI: route держится управляемым Promise до наблюдения индикатора; освобождение в `finally`, без таймера ожидания. Browser focus/cookie/Web Locks/геометрия не мокируются.
