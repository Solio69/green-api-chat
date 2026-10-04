# Модель архитектурной карты 035

## Запись владения

`current_path` — tracked путь относительно корня, уникальный ключ.
`kind` — `source` или `test`; `owner` — один из auth, account,
recipients, chats, conversation, shell, shared, server, test-platform.
`target_area` — один из feature/layer, shared, server или app;
`migration_task` — номер 036–054 либо `retain` с обоснованием в
`disposition` (`move`, `split`, `adapt`, `retain`). `notes` фиксирует исключение или переходную роль. `split` означает, что один нынешний файл смешивает несколько слоёв: `target_area` указывает feature, а задача отделяет чистую модель от Query/server-контрактов.
Пустые owner/target/task недопустимы. CSV хранится в UTF-8.

Для файлов `src/app` путь сохраняется в app, но owner отражает
делегируемый feature. Для fixture/test путь может сохраниться, если
его владелец и задача тестовой миграции определены. Файлы, созданные
после фиксации карты, сверяются в 054.

## Модуль и зависимости

Feature имеет `model` (чистые типы/функции), `application` (use-case,
Query coordination), `ui` (Client Component/React hook) и `server`
(серверный handler/adapter, если нужен). Публичные entry points
раздельны по среде. Композиция `app` импортирует их; client UI не
импортирует server. `shared` не импортирует feature. Серверная
инфраструктура зависит от публичных чистых контрактов, не наоборот.

## Переход

Transition: `current_path`, `owner`, `removal_task`, `replacement_entry`,
`verification`. Неограниченных compatibility barrels нет. Статус
`planned → migrated → removed`; финальная сверка 054 закрывает переход.
