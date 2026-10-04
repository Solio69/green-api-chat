# Data model 053

| Сущность | Поля | Инвариант |
| --- | --- | --- |
| Browser scenario | ID, suite, file, title, boundary, decision | Ровно один ID на каждый из 149 обнаруженных браузерных сценариев |
| Baseline reference | 109 B028 E2E, 37 retained B028/N052 Query, 3 N053 E2E | Нет пропавшего B028 E2E; девять перенесённых RTL не возвращаются в браузер |
| Browser boundary | Production routes/fake provider или Next Query fixture + Chromium | UI/HTTP/cookie/Web Lock/scroll/geometry проверяет реальный браузер |
| Selector exception | Файл, проверяемый аспект, причина CSS/DOM доступа | CSS допустим, когда структура/стиль сами являются контрактом |
| CI result | SHA, two jobs, artifacts, status | Только фактический успешный прогон означает Passed; report доступен при failure |

Состояние: 052 Green 149 → точечная правка assertions → неизменные 149 ID и полный локальный Green → обе CI jobs + artifacts. Внутренний SVG path не входит в публичный контракт.
