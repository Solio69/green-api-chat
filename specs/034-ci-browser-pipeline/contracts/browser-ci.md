# Контракт Browser CI и фокуса 034

- Push main/refactor и PR создают jobs quality и browser. Общий run успешен,
  только если обе завершились success.
- Browser job после clean npm ci ставит Chromium с OS dependencies,
  запускает query и E2E без retries и с одним worker.
- Query и E2E используют разные серверы, .next и outputDir.
- Логи/trace/screenshot/HTML сохраняются при тестовой ошибке; отсутствие
  файлов даёт неуспешный upload, не маскируя исходную проверку.
- Production E2E использует фиктивную сессию/ответы и не обращается к
  реальному GREEN-API. Любой неожиданный provider origin — ошибка.
- После смены desktop→mobile фокус из скрытой панели переписки оказывается
  на выбранной строке чата, даже при задержке ResizeObserver.
- Возврат mobile→desktop не отбирает фокус у внешнего элемента.
- Controlled browser failure даёт job/run failure и artifact с диагностикой;
  итоговый workflow не содержит контрольного файла/шага.
