# Data model 054

| Сущность | Поля/роль | Инвариант |
| --- | --- | --- |
| Migration entry | `source`, `target`, `owner`, `basis`, `migrationTask` | Уникальный source и target, исходник существует, target до переноса свободен |
| Import edge | Source module, resolved target, `type`/runtime, layer | Любой локальный import после переноса разрешается; циклов feature modules нет |
| Public entry | Feature/layer index, фактические потребители | Client entry не реэкспортирует server runtime; нет пустого переходного barrel |
| Query session context | Neutral QuerySession, provider/hook | Shared context не создаёт feature session и не навигирует; facade хранит прежний жизненный цикл |
| Boundary rule | Glob, forbidden patterns, positive/negative lint example | Ошибочный импорт отклоняется, допустимый не меняет результат ESLint |
| Review issue | Source, impact, disposition | Новое поведение не внедряется без отдельного требования |

Структурное состояние: 69 старых путей + текущий граф → перемещение и перепись импортов → адресный разрыв циклов/context → проверки/CI → 0 старых source путей, 0 запрещённых графовых связей. Допустимые Next entry `app` и styles не входят в 69.
