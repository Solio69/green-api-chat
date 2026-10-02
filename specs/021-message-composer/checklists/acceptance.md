# Acceptance: форма и отправка

**Kind**: Acceptance. **Status**: NotRun. **Дата**: 2026-10-02.

| ID  | Сценарий                                                                         | FR / SC                        | Результат |
| --- | -------------------------------------------------------------------------------- | ------------------------------ | --------- |
| A01 | Enter/click once, Shift/IME/empty zero, исходный текст                           | FR-001/002/003/013, SC-001/007 | NotRun    |
| A02 | Before idMessage no bubble, accepted ≠ delivered/read                            | FR-004/010, SC-004             | NotRun    |
| A03 | Pending one send, поле blocked, switch/close/mobile, A→B→A late guard            | FR-003/005/009/011, SC-002/006 | NotRun    |
| A04 | Новая запись только после accepted, GetChats missing сохраняет, без дубля        | FR-007, SC-003                 | NotRun    |
| A05 | HTTP/history/early status merge id, no text guessing/fiction                     | FR-006/010, SC-004             | NotRun    |
| A06 | Unknown сохраняет нужный текст; history first; manual warning; no retry          | FR-005/008/009, SC-005/007     | NotRun    |
| A07 | Nonowner/expired scope/logout/late result не дают send или перенос данных        | FR-001/005/012, SC-002/006     | NotRun    |
| A09 | Grace disconnect сохраняет accepted исходной попытки, revoked proof не публикует | FR-004/005/012, SC-002/004/006 | NotRun    |
| A10 | Merge issues передаются shared core019 без drop/создания пузыря                  | FR-006/010, SC-004             | NotRun    |
| A08 | Реальный React StrictMode/unmount/two consumers; a11y/mobile/layout unchanged    | FR-002/003/011, SC-001/006     | NotRun    |

Команды и фактические Red/Green/refactor результаты сохраняются после кода
в verification.md; галочки readiness не подтверждают ни один сценарий выше.
