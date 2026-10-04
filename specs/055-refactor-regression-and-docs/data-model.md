# Data model 055 — результаты проверок

Это документальная модель, а не новая runtime-сущность.

| Сущность | Поля | Инвариант |
| --- | --- | --- |
| `FinalRevision` | branch=`refactor`, full Git SHA, состав changed paths | Каждая локальная проверка относится к состоянию файлов после последних содержательных правок; удалённый run имеет этот `head_sha`. |
| `VerificationRecord` | команда, слой, статус `Passed/Failed/Blocked/NotRun`, счётчик/ошибка, SHA/время | Не выводить Passed из наличия инструмента или чужого SHA. `test:e2e` включает production build. |
| `CoverageGuarantee` | ID G01–G08, B028 scenario IDs, нынешние test files, граница доказательства | Каждый критический контракт имеет существующий сценарий или явное замечание. ID и файлы сверяются с картами 028/051/052/053. |
| `DocumentationLink` | source Markdown, relative target/anchor, состояние | Активный локальный target существует; исторический spec не объявляется текущим путём кода. Внешние URL не считаются локальным target. |
| `ReadinessStatus` | local, CI, product/deploy limitations | Локальная готовность и GitHub готовность указываются раздельно; реальные GREEN-API и deployment не объявляются проверенными. |

`verification.md` представляет записи проверок, `coverage-reconciliation.md` — гарантии, README и действующие docs — инструкции. В продуктовых данных и API изменений нет.
