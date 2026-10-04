# Контракт quality CI

- Pull request, push main/refactor и manual event заданы явно.
- Job получает только contents:read; credentials checkout не сохраняются.
- На чистом Ubuntu runner устанавливаются Node 24 и npm 11-совместимый runtime,
  выполняется npm ci из lockfile независимо от наличия кеша.
- Ошибка любой команды делает job/run неуспешным; tee не поглощает exit code.
- Полный typecheck, ESLint, Stylelint, format, Vitest и integration обязательны.
- Шаги после ошибки skipped по стандартному GitHub success условию;
  artifact с уже созданными логами доступен после failure.
- Timeout 15 минут; устаревший run одной ref отменяется concurrency.
- Remote success считается подтверждённым только по точному head_sha.
- Negative TS2322 должен показать failure шага types, failure job/run и
  диагностический лог. После восстановления — success на новом head_sha.
