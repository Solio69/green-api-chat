---
name: speckit-checklist
description: Создать или обновить чек-лист качества требований; отделить его от будущих приёмочных проверок.
metadata:
  author: github-spec-kit
  source: templates/commands/checklist.md
  adaptation: green-api-chat
---

# checklist

Применять только к выбранной задаче этого проекта. Пользовательские решения
и ограничения сохраняются между этапами. Общий порядок:
[workflow](../../../docs/spec-kit-workflow.md);
правила: [AGENTS](../../../AGENTS.md),
[constitution](../../../.specify/memory/constitution.md),
[Git](../../../GIT_POLICY.md).
Происхождение: [provenance](../../../docs/spec-kit-provenance.md).

## Контекст вызова

Определить абсолютный $taskProject по расположению этого SKILL.md (три уровня
вверх). Взять ожидаемую задачу из текущего обсуждения, а не из имени ветки.
Явно задать SPECIFY_FEATURE_DIRECTORY и абсолютный $taskFeature.
При неизвестной задаче запросить её, не выбирать последнюю.

Любой именованный ниже script расположен в
.specify/scripts/powershell/ относительно $taskProject. Вызов из корня
или подкаталога проекта, например:

~~~powershell
& (Join-Path $taskProject '.specify/scripts/powershell/check-prerequisites.ps1') -Json -RequireSpec -ExpectedFeatureDirectory $taskFeature
~~~

В каждом вызове передавать -ExpectedFeatureDirectory $taskFeature.
Проверить успешный exit code и точное совпадение FEATURE_DIR с ожидаемым путём
до чтения документов. При ошибке остановить зависимую работу и объяснить причину.
Рабочие зависимости только локальные; hooks, публикация, установки и автоматические
Git-действия отсутствуют.

## Порядок

1. Выполнить check-prerequisites.ps1 с -Json -RequireSpec.
2. Для requirements прочитать spec; plan читать лишь если он нужен и существует.
   Отсутствие plan до согласования spec допустимо.
3. Применить [checklist-template.md](../../../.specify/templates/checklist-template.md):
   пункты проверяют полноту, ясность, согласованность, измеримость и покрытие
   требований, не выполнение реализации. Для каждого вывода дать основание.
4. Создать/обновить конкретный checklist внутри выбранной feature. Сохранить
   обоснованные отметки существующего документа, пересмотреть затронутые правками.
   Не создавать однотипные дубликаты.
5. Если нужен чек-лист приёмки, отдельно обозначить Kind: Acceptance и статусы
   NotRun/Passed/Failed/Blocked. Он не выдаётся за readiness.
6. Сообщить результат и значимые пробелы; чек-лист не заменяет analyze
   и не является разрешением на реализацию.
