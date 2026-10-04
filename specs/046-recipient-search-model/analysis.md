# Анализ 046 до реализации

Дата: 2026-10-03. Проверены spec/checklist/research/plan/data-model/contracts/quickstart/tasks, C1–C8, карта 035, фактические исходники и тесты. Read-only проход: 22 пути, SHA-256 до/после 1db2941bac1bc7cfad431809e0ac8574bd95fbf9bf73862547d3387eab2edcc1, unchanged=true. Отчёт записан отдельным действием после прохода.

## Findings

Открытых CRITICAL/HIGH/MEDIUM/LOW: 0. План явно устраняет два уже выявленных противоречия target CSV фактическим зависимостям: resolve-search использует server/http и возвращает Response, поэтому назначается recipients/server; format-recipient-label — чистая функция, поэтому назначается recipients/model. Для обоих предусмотрено точечное обновление строк CSV, а не изменение HTTP/продуктового поведения. Пять UI-компонентов переходят в recipients/ui по карте 035. Поле поиска не содержит name и не сериализует запрос до гидратации; план сохраняет это.

## Покрытие требований

| Требование | Задачи |
| --- | --- |
| FR-001 | T001, T003–T006 |
| FR-002 | T001, T003–T006 |
| FR-003 | T001, T003–T006 |
| FR-004 | T003–T006 |
| FR-005 | T001, T003–T006 |
| FR-006 | T001, T003–T006 |
| FR-007 | T001, T003–T006 |
| SC-001 | T003–T007 |
| SC-002 | T003–T007 |
| SC-003 | T003–T007 |

7 FR, 3 SC, 7 задач; покрытие 10/10, задач без требования 0, существенных неоднозначностей и дублей 0. C1–C8 PASS: варианты и цена описаны; граница модуля не смешана с другими R08; разрешение реализации/commit/push уже есть; новых пакетов, БД и реальных реквизитов нет; baseline 7/7 integration и 10/10 browser Passed; новый abort lifecycle идёт через тест/поведенческий Red → Green → Refactor; выбран локальный state без второго store. Полный набор проверок, повторный анализ и CI пока NotRun; результаты будут в verification.md.

## Read-only анализ после реализации

Проверены 48 файлов комплекта, карты 035, нового model/server/ui и тестов; SHA-256 до/после e4921cdafcf4444e76bc227db538811064ff9cbb819a682052794db88bd7dbaa, unchanged=true. Старых runtime/test импортов lib/recipients и пяти components/RecipientSearch* нет; model/ui не импортируют recipients/server, server runtime и next/headers. ResolveSearchResult находится в server, форматирование подписи — в model; соответствующие две строки CSV уточнены. C1–C8 PASS, покрытие FR/SC 10/10, открытых findings 0. Итоги тестов и CI приводятся в verification.md.
