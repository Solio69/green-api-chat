# Acceptance: Статусы доставлено/прочитано/отказ

**Kind**:Acceptance. **Дата**: 2026-10-02. **Status**:PassedSynthetic; CodeAuthorized.
Источник:[spec](../spec.md),[plan](../plan.md),[tasks](../tasks.md). Это фактическая проверка поведения на фикстурах, а не readiness документов.

- [x] CHK001 [SC-001] В четырёх случаях delivered/read/failed/noAccount с idMessage обновляется только правильное исходящее сообщение; принятие API не заменяет фактический статус (FR-001/002/003/005). **PassedSynthetic**.
- [x] CHK002 [SC-002] Повтор и перестановки read → delivered → HTTP acceptance → старый history не создают дубль и не понижают read (FR-004). **PassedSynthetic**.
- [x] CHK003 [SC-003] Событие отказа без idMessage не меняет ни одно произвольно выбранное сообщение; статус до текста обрабатывается по согласованной политике (FR-006/007). **PassedSynthetic**.
- [x] CHK004 [SC-004] Чужой scope, неизвестное значение, ошибка SSE и отсутствие события не создают ложный результат или повторную отправку (FR-009/012/013). **PassedSynthetic**.
- [x] CHK005 [SC-005] Требуемые настройки описаны и не изменены агентом; ошибка без idMessage наблюдаема как общая ошибка правильного чата/подключения. Правила сопоставления ранних событий и отсутствия понижения измеримы и переходят в research/plan (FR-006/007/008/010/011). **PassedSynthetic**.

- [x] CHK090 TDD Red/Green/Refactor фактически подтверждён и записан в verification.md. **PassedSynthetic**.
- [x] CHK091 Команды plan/quickstart и ручные fake сценарии выполнены, ограничения повтора/изоляции сохранены. **PassedSynthetic**.
- [x] CHK092 Credentials/rawPII отсутствуютв fixtures/output/clientURL; remote settings/Git/staging не изменены. **PassedSynthetic**.
- [x] CHK093 Итоговый diff соответствует spec, предкоммитное ревью/risks/nextsteps записаны. **PassedSynthetic**.

Не ставить x или Passed за read-only review/spec approval. Blocked означаетнехваткуобязательных dependency/окруженияпослеразрешениякода, неимитациютестов.

## Границы доказательств

**PassedSynthetic**: постоянные тесты с фиктивными данными и перехватом provider.
**Operator: NotRun**: реальная отправка/приём/настройки GREEN-API и ручное ревью пользователя.
Автоматические результаты не выдаются за ручную проверку реального инстанса.
Сценарии и точные команды: [verification](../verification.md).
