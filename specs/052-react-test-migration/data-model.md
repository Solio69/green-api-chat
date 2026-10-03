# Data model 052

| Сущность | Поля/смысл | Инвариант |
| --- | --- | --- |
| React scenario | `id`, source title, React behavior, browser residue | Один B028 или N052 ID у каждого текущего сценария |
| RTL host | Реальный provider tree, доступные controls/outputs | Проверяет наблюдаемую реакцию, не внутренний hook shape |
| Browser contract | Настоящий HTTP/Next, cookie, две вкладки, Web Lock, фокус, scroll или геометрия | Не исчезает при переносе React-части |
| QuerySession | Scope, QueryClient, active/cleanup | Два consumer делят cache; закрытый scope не принимает late result |
| Fixture probe | Только test app, ссылка из активного сценария | Удаляется после Green всех потребителей |

Состояния: baseline 46 → параллельный RTL/Playwright Green → 9 RTL + 37 browser; карта указывает новое место, а 051 Node tests сохраняют чистые cache/domain контракты.
