# Acceptance: форма и отправка

**Kind**: Acceptance. **Status**: PassedSynthetic. **Дата**: 2026-10-02.

| ID  | Сценарий                                                                         | FR / SC                        | Результат       |
| --- | -------------------------------------------------------------------------------- | ------------------------------ | --------------- |
| A01 | Enter/click once, Shift/IME/empty zero, исходный текст                           | FR-001/002/003/013, SC-001/007 | PassedSynthetic |
| A02 | Before idMessage no bubble, accepted ≠ delivered/read                            | FR-004/010, SC-004             | PassedSynthetic |
| A03 | Pending one send, поле blocked, switch/close/mobile, A→B→A late guard            | FR-003/005/009/011, SC-002/006 | PassedSynthetic |
| A04 | Новая запись только после accepted, GetChats missing сохраняет, без дубля        | FR-007, SC-003                 | PassedSynthetic |
| A05 | HTTP/history/early status merge id, no text guessing/fiction                     | FR-006/010, SC-004             | PassedSynthetic |
| A06 | Unknown сохраняет нужный текст; history first; manual warning; no retry          | FR-005/008/009, SC-005/007     | PassedSynthetic |
| A07 | Nonowner/expired scope/logout/late result не дают send или перенос данных        | FR-001/005/012, SC-002/006     | PassedSynthetic |
| A09 | Grace disconnect сохраняет accepted исходной попытки, revoked proof не публикует | FR-004/005/012, SC-002/004/006 | PassedSynthetic |
| A10 | Merge issues передаются shared core019 без drop/создания пузыря                  | FR-006/010, SC-004             | PassedSynthetic |
| A08 | Реальный React StrictMode/unmount/two consumers; a11y/mobile/layout unchanged    | FR-002/003/011, SC-001/006     | PassedSynthetic |

Команды и фактические Red/Green/refactor результаты сохранены в verification.md; галочки readiness не подтверждают ни один сценарий выше.

## Границы доказательств

**PassedSynthetic**: постоянные тесты с фиктивными данными и перехватом provider.
**Operator: NotRun**: реальная отправка/приём/настройки GREEN-API и ручное ревью пользователя.
Автоматические результаты не выдаются за ручную проверку реального инстанса.
Сценарии и точные команды: [verification](../verification.md).
