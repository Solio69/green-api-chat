# Data Model: test fixture lifetime

| Ресурс | Владелец | Создание/очистка | Инвариант |
| --- | --- | --- | --- |
| E2E fake state | общий тестовый Next process | reset до и после Playwright scenario | maps пусты, receipt=0, generation увеличено |
| E2E browser context | Playwright test | штатное создание/закрытие runner | cookie/Web Locks/geometry реальны, не наследуются |
| Query fixture | отдельный query Next process | reset до и после scenario | queue/sends/deletes/counters пусты; context создан заново |
| Async fake send/status | generation при старте | игнорировать при несовпадении после await/timer | не загрязняет следующий сценарий |
| Vitest QueryClient/timers | test/helper | новый экземпляр и существующий afterEach | нет общего кеша или fake clock |
| Expected protocol | test-only literal | статичен | не импортирует production результат |

Один scenario может иметь несколько browser contexts — reset относится ко всему сценарию, не к одному context. При ошибке внутри теста fixture вызывает cleanup в `finally`. Ошибка самого reset прерывает scenario явной ошибкой.
