# Асинхронные контракты 032

- Awaited operation: вызывающий код ждёт завершения и сохраняет обработку отказа.
- Detached operation: sync event запускает Promise, исход которого уже отражён
  в query/controller/form state; явный void обозначает намерение, не обработчик.
- Rule diagnostic: файл, строка, ruleId, ожидаемый failed/valid результат.
- Type project: одна из трёх TS-программ 031; JS конфиги вне typed parser области.

Новые бизнес-состояния или данные не вводятся. Матрица владельцев ошибок
в research.md ограничивает допустимые event adapters.
