# Происхождение локального комплекта

**Дата проверки**: 2026-09-29.
Источник адаптации: D:/Pet-projects/agent-flow-harness.
Метаданные локальной установки указывают speckit_version 0.8.15; совпадение
её файлов с upstream-тегом не подтверждено. Это не обещание автоматических
обновлений и не рабочая зависимость.

Skills сохраняют author github-spec-kit и source templates/commands/*.md.
Служебные scripts переработаны по согласованным контрактам; setup-spec.ps1 и
контрактный тест созданы для этого проекта. Продуктовые правила исходного
приложения, hooks, presets/extensions, feature.json, интеграции и публикация
issues не переносятся. Выбор feature, проверка путей, сохранение документов,
процесс согласования и ограничения адаптированы к GREEN-API Chat.
GIT_POLICY.md копируется побайтно; AGENTS/constitution описывают текущие правила.

В исходной установке отдельный LICENSE комплекта не найден.
[Официальный текст MIT License](https://raw.githubusercontent.com/github/spec-kit/main/LICENSE)
проверен 2026-09-29 и сохранён в [spec-kit-LICENSE.txt](licenses/spec-kit-LICENSE.txt)
с уведомлением Copyright GitHub, Inc. Источник уведомления — main;
точное соответствие непроверенному тегу не заявляется.

## Снимок источников SHA-256

| Исходный файл                                       | SHA-256                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| GIT_POLICY.md                                       | 7DD006E604888BFFF9F8146CBC036857633CF75038CEEF306F050E53BE6E2263 |
| AGENTS.md                                           | C442158F09D42E09B90A7AF3D0256315ADF6612064AB0EA4F539AAD2E5AB8A65 |
| docs/spec-kit-workflow.md                           | AC300F6ECD938CC5887632DC04A5C4A0C553DAB4F34D9681D07D734805429673 |
| .specify/init-options.json                          | C4A23CA6AAB9B4ADA40AF2D8295F617FFD8E7D086E2CE5F224C29A3C7D810721 |
| .specify/templates/spec-template.md                 | B17F61A096EC6EEDDB8983459641BA9912CE845F70C62C3C71BA7C3F3ABAC98C |
| .specify/templates/plan-template.md                 | 78AD3DDB629A0852DE7FA49173AE5022400F8E04B122D114D6B728ECF42B5477 |
| .specify/templates/tasks-template.md                | 57D028B48B7EE9EE2E7ABBA1B5D9789ED8ECD4480251924B26B83688C7864A92 |
| .specify/templates/checklist-template.md            | 709D8AB8384A3A49F5E0F64479F71553EF6D6F8BB4F00281B05F47837993B536 |
| .specify/templates/constitution-template.md         | CE7549540FA45543CCA797A150201D868E64495FDFF39DC38246FB17BD4024B3 |
| .specify/scripts/powershell/common.ps1              | E5F2350CD7915D4835C2F709852651FC8C6466012F7C084703B9B179E4655C83 |
| .specify/scripts/powershell/check-prerequisites.ps1 | E88BFD5C0ADA702CF3E4FA0848853DF93F84CCE7C674FE822D386BDC34A257BB |
| .specify/scripts/powershell/setup-plan.ps1          | 88BC336221DCF556EFC0E9E029504E3BD8383F955647E0733320999DA57BCEFD |
| .specify/scripts/powershell/setup-tasks.ps1         | 34724996201BC25A0E702CED68608EFFE76C3E9976684B275991BF400D1EDB58 |
| .agents/skills/speckit-constitution/SKILL.md        | E2CBE859958C5A05BE52A44D63821E6A84D39F3D37ACC05B550CC7AD85DA0DAB |
| .agents/skills/speckit-specify/SKILL.md             | 73E0525138E2D7999CD75C843A1D8A8CE761CF0681467D861E5E40EA056B5BE4 |
| .agents/skills/speckit-clarify/SKILL.md             | BBF8574F8C7C71B7489EDE48B28B75CD4F86A978E0DD5B6F6692478498D423A7 |
| .agents/skills/speckit-plan/SKILL.md                | FA0AA5743A97722C52FAF0E365F2441A9C4E4359E9AF318A12C9F576204254EA |
| .agents/skills/speckit-tasks/SKILL.md               | 09BE13A98C63209CD32F07266F826EA0BAF63150683B2831D41CB033DB0E678B |
| .agents/skills/speckit-analyze/SKILL.md             | 72E20E5C6A9BA50A32579AB8DDE8E4C217745A97744BF330C1F1331392CDA4D2 |
| .agents/skills/speckit-implement/SKILL.md           | 0F4C3643A2BF364C57C824F614B3F601E5B06265E6F52D3ADACD4F50F6FE6E00 |
| .agents/skills/speckit-checklist/SKILL.md           | B19870B298E06C4423633B795988C3CD3D8661F1FC737F22909205861CE090D9 |

Хеши фиксируют прочитанные локальные файлы, а не удостоверяют их соответствие
официальному релизу. После адаптации целевые файлы закономерно отличаются,
кроме неизменённой политики Git.

## Использование

Рабочие пути всегда локальные: [процесс](spec-kit-workflow.md),
[правила проекта](../AGENTS.md). Для запуска нужны только Windows,
PowerShell 7 и встроенные .NET; обращения к источнику или сети не выполняются.
