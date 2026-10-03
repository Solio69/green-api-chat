# Acceptance

Kind: Acceptance. 2026-10-03. Статус: PassedSynthetic.

| Проверка | Статус |
| --- | --- |
| Independent-instance receive/ACK; tamper/expiry/scope guards | PassedSynthetic — integration |
| Lost delete response; incoming/status/ignored/invalid | PassedSynthetic — integration/Query |
| Sequential loop/deadlines/cancel/recovery; no send retry | PassedSynthetic — integration/Query |
| Same-browser two tabs, release/retry/reload/StrictMode | PassedSynthetic — Query/integration |
| Query/unread/history/send/login/logout regression | PassedSynthetic — 353 integration/45 Query/109 E2E |
| Quality/build | Passed — lint/styles/format/types, production build |
| Read-only анализ | Результат в analysis.md |
| Real Vercel/Telegram smoke (operator-only) | NotRun |

Две вкладки проверены настоящими browser pages одного context. Независимые
server handlers проверены через общий контракт с одним фиктивным секретом без registry.
Несколько устройств/origins/profiles, provider exactly-once и реальные тарифные
ограничения не заявляются автоматической приёмкой.
