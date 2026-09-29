---
name: speckit-constitution
description: Оформить согласованные принципы проекта и проверить зависимые локальные инструкции.
metadata:
  author: github-spec-kit
  source: templates/commands/constitution.md
  adaptation: green-api-chat
---

# constitution

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
& (Join-Path $taskProject '.specify/scripts/powershell/check-prerequisites.ps1') -Json -PathsOnly -ExpectedFeatureDirectory $taskFeature
~~~

В каждом вызове передавать -ExpectedFeatureDirectory $taskFeature.
Проверить успешный exit code и точное совпадение FEATURE_DIR с ожидаемым путём
до чтения документов. При ошибке остановить зависимую работу и объяснить причину.
Рабочие зависимости только локальные; hooks, публикация, установки и автоматические
Git-действия отсутствуют.

## Порядок

1. Выполнить check-prerequisites.ps1 с -Json -PathsOnly для явно выбранной задачи.
   Прочитать локальные AGENTS, GIT_POLICY, constitution и согласованные решения.
2. Перед существенным изменением принципов объяснить варианты и получить решение.
   Для уже согласованного оформления повторное разрешение не запрашивать.
3. По [constitution-template.md](../../../.specify/templates/constitution-template.md)
   оформить текущие принципы, версию, дату и основание. Не ослаблять ограничения,
   не добавлять чужие продуктовые решения и встроенную историю изменений.
4. Проверить зависимые AGENTS, docs/spec-kit-workflow.md, реально существующие
   .agents/skills/ и templates. Не обращаться к отсутствующим templates/commands.
5. Правки за пределами согласованного объёма сначала обсудить. Перечислить
   затронутые документы и проверки; эта операция не разрешает реализацию приложения.
