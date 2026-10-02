# Acceptance: серверная отправка

**Kind**: Acceptance. **Status**: PassedSynthetic. **Дата**: 2026-10-02.
Не заменяет требования или разрешение реализации.

Дополнительные assertions A05/A07: credential-containing idMessage не
сериализуется (unknown), исходный текст не редактируется; valid accepted не
теряется из-за исключения release/cleanup.

| ID  | Сценарий                                                                                                       | FR / SC                    | Результат       |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------- |
| A01 | Correct cookie/scope/proof, один call, idMessage string и accepted DTO                                         | FR-001/002/004, SC-001     | PassedSynthetic |
| A02 | Invalid/empty/whitespace/over-limit/body/группы, zero calls                                                    | FR-003, SC-002             | PassedSynthetic |
| A03 | Cookie expired, foreign scope, no proof, blocked owner, send busy                                              | FR-002/010, SC-002/005     | PassedSynthetic |
| A08 | Matching Origin проходит; missing/null/invalid/foreign→403/not_sent до body/lease/provider, cookie сохраняется | FR-002/005/010, SC-002/005 | PassedSynthetic |
| A04 | Original пробелы/переносы, code-point boundary, нет fake timestamp                                             | FR-003/004, SC-001/004     | PassedSynthetic |
| A05 | Provider refusal/auth/429, тайм-аут/5xx/lost/malformed, no retry                                               | FR-005/006/007, SC-003     | PassedSynthetic |
| A06 | Late response original scope/chat/attempt, SSE-status-beforeHTTP identity                                      | FR-008/009, SC-004         | PassedSynthetic |
| A07 | HTTP methods/no-store/no secrets, lock held until settlement, cookie cleanup failure                           | FR-002/005/010, SC-003/005 | PassedSynthetic |

Red/Green/Refactor, команды, версии, доказательства zero/one provider calls,
ограничения и итоговое ревью сохранены в [verification.md](../verification.md). Статусы относятся к полному синтетическому набору: handler/adapter, cookie/proof/stream и методы маршрута.

## Границы доказательств

**PassedSynthetic**: постоянные тесты с фиктивными данными и перехватом provider.
**Operator: NotRun**: реальная отправка/приём/настройки GREEN-API и ручное ревью пользователя.
Автоматические результаты не выдаются за ручную проверку реального инстанса.
Сценарии и точные команды: [verification](../verification.md).
