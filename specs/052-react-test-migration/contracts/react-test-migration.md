# Test migration contract 052

1. Для каждого из 46 Query-сценариев `scenario-map.json` задаёт один уникальный ID и решение. Девять перенесённых получают явный RTL путь, 37 оставшихся — исходный browser путь.
2. RTL проверяет настоящие `QueryProvider`, `ConversationSelectionProvider`, QueryClient и доступный DOM. Fake `fetch` управляет только HTTP boundary; deferred promises определяют порядок и отмену. Asynchronous assertions awaited; cleanup освобождает session/timers.
3. Strict Mode replay подтверждается существующим `provider-lifecycle.test.tsx` с наблюдаемыми setup/cleanup и единственным владельцем. Новые selection tests не должны выдавать обычный render за такую проверку.
4. Browser suite остаётся источником гарантий настоящего Next/cookie/HTTP, Web Locks, двух вкладок, фокуса/scroll/геометрии. Probe/route удаляются только при отсутствии всех потребителей.
5. Удаление старого теста разрешено после фактического Green нового с эквивалентными отказами и границами; discovery сравнивается по ID, а не только по количеству.
