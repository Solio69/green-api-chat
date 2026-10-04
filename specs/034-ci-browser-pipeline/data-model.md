# Модель браузерного CI 034

- Workflow run: event, head_sha, run_id, общий conclusion.
- Browser job: отдельный conclusion; success только при обоих наборах.
- Query app: свой .next, порт 3102, output test-results/query,
  HTML test-results/query-report.
- Production app: корневой .next, порт 3101, fake server fetch через
  NODE_OPTIONS, output test-results/e2e, HTML playwright-report.
- Browser artifact: логи, traces, screenshots и два HTML-отчёта.
- Focus state: выбранный чат, видимая мобильная панель, последний элемент
  внутри workspace, фактический document.activeElement.
- Доставка ResizeObserver может задерживаться/коалесцироваться.
  Window resize сообщает о viewport независимо от размеров элемента;
  оба пути вызывают общий идемпотентный recoverFocus.
- Доступ к GREEN-API: только фиксированный fake origin; неожиданный
  provider origin отклоняется тестовой фикстурой.

Тестовый файл/шаг контрольного failure существует только в промежуточной
CI-проверке и отсутствует в итоговом состоянии.
