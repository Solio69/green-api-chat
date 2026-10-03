# Browser test contract 053

1. `browser-map.json` должен содержать все 112 production E2E и 37 Query browser IDs с уникальными `(suite,file,title)`. После рефакторинга discovery сверяется с картой, не только с итоговым числом.
2. Production E2E использует настоящий Next build/routes, cookie и browser context; fake provider блокирует внешнюю отправку. Query browser использует отдельную Next fixture и настоящий Chromium. Эти гарантии не объявляются покрытыми Vitest.
3. Доступные действия и переключение состояния проверяются по role/name/title/input type/value. SVG serialization/path, случайные wrapper nodes и generic input counts не являются поведенческими оракулами.
4. CSS/DOM измерения сохраняются там, где contract — pixel geometry, touch target, contrast/theme, scroll/focus, reduced motion, отсутствие секретов в HTML, avatar fallback/decoration. Исключения документированы и не используются вместо доступного действия.
5. Нет arbitrary sleeps и runner retries. Ожидания значимого состояния и изолированные fake fixtures; test failures дают HTML/trace и E2E screenshot. Отсутствие Chromium/сборки явно Blocked.
6. Локальный запуск `npm run test:query` и затем `npm run test:e2e`; GitHub `quality` и `browser` jobs запускают те же наборы, с artifact при ошибке. Негативный CI oracle уже доказан в 034; 053 подтверждает актуальный positive run и сохранность конфигурации.
