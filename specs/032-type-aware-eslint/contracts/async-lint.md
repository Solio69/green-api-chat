# Контракт async lint

- no-floating-promises: error, ignoreVoid:true. Неожидаемый Promise без return,
  catch/rejection handler или явно обоснованного void даёт ошибку.
- no-misused-promises: error, все стандартные checks включены, включая attributes.
- Эти правила действуют во всех применимых TS/TSX/MTS. JS проходит прежние правила.
- void не доказывает отсутствие rejection; владельца отказа проверяют по research
  и тестам. Catch/await внутри существующих операций не удаляется.
- Promise в условии, async callback синхронного forEach и async JSX handler
  должны диагностироваться. await/catch/return и sync adapter проходят.
- Никаких глобальных disable и установок для снятия ошибок.
