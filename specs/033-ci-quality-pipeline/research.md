# Исследование CI качества 033

Дата: 2026-10-03. Репозиторий Solio69/green-api-chat приватный, default branch
main подтверждена Git ls-remote --symref и GitHub API. Actions-запусков до
начала работы нет. API доступен через существующую Git-аутентификацию;
учётные данные не записываются в файлы и не выводятся.

## Выбор

| Вариант | Польза | Ограничение |
| --- | --- | --- |
| Один quality job на ubuntu-24.04 | Простая диагностика, одна установка | Проверки последовательны; для текущего размера достаточно |
| Job на каждый lint/test | Параллельные статусы | Повторные установки и лишняя конфигурация |
| Node 24, проверка npm major 11 | Соответствует engines и обновлениям поддерживаемой ветки | Точные runtime версии фиксируются в логе каждого запуска |
| SHA официальных actions | Воспроизводимый action code | Обновление SHA требует отдельной проверки |
| npm cache + обязательный npm ci | Быстрее последующие запуски | Первый запуск без кеша должен также пройти |
| Push main/refactor, PR, manual | Проверка рабочей ветки до merge | Manual dispatch доступен только после появления workflow в default branch |

Выбран один quality job, timeout 15 минут, contents:read, concurrency на ref
с отменой устаревших запусков. PR-trigger не использует pull_request_target.
Отдельный browser job добавляется в 034.

Официальные стабильные v7 action refs проверены git ls-remote:
- checkout: 3d3c42e5aac5ba805825da76410c181273ba90b1
- setup-node: 820762786026740c76f36085b0efc47a31fe5020
- upload-artifact: 043fb46d1a93c77aae656e7c1c64a875d1fc6a0a

Полные npm stdout/stderr сохраняются через tee; Bash pipefail обеспечивает
ошибку шага при падении npm. Upload выполняется при успехе/ошибке, но не
при отменённом run; missing files дают warning и не скрывают исходную причину.
Артефакты качества хранятся 7 дней. Секреты пользователя не используются.
Контроль Node/npm проверяет major versions до npm ci.

## Отрицательная удалённая приёмка

Постоянный fault-injection input не нужен. После первого зелёного запуска
временный workflow step создаст в runner src/ci-typecheck-probe.ts с TS2322.
Этот контроль будет отдельно проверен локально, закоммичен и отправлен в
разрешённую refactor; ожидается реальный failed quality/typecheck и лог.
Затем временный step удаляется отдельным проверенным commit, отправляется,
подтверждается зелёный итог. В рабочем приложении контрольного файла нет.
Это исполнение согласованного SC-002; намеренный Failed фиксируется как
успешный отрицательный контроль, а не как рабочий зелёный CI.

## Источники

- [checkout](https://github.com/actions/checkout)
- [setup-node](https://github.com/actions/setup-node)
- [upload-artifact](https://github.com/actions/upload-artifact)
- [Manual workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow): требуется workflow в default branch.
- Локальные quick checks и test counts подтверждены задачей 032.
